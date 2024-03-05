import { useEffect, useState } from 'react';
import { Editor, EditorState, Modifier, RichUtils, getDefaultKeyBinding, convertFromRaw, convertToRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import "./Editor.css";

const colorStyleMap = {
    red: {
        color: 'rgba(255, 0, 0, 1.0)',
    },
    code: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    }
}

const CustomEditor = () => {
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [loading, setLoading] = useState(false);
    const handleChange = (newEditorState: EditorState) => {
        setEditorState(newEditorState);
    };
    const reset = (editorState: EditorState) => {
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const blockKey = contentState.getBlockForKey(selection.getStartKey());
        const blockType = blockKey.getType();
        if (selection.isCollapsed() && blockType !== 'unstyled') {
            editorState = RichUtils.toggleBlockType(
                editorState,
                'unstyled'
            )
            return editorState
        }
        const currentStyle = editorState.getCurrentInlineStyle();
        if (currentStyle.has('BOLD')) {
            editorState = RichUtils.toggleInlineStyle(editorState, 'BOLD');
            return editorState
        }
        if (currentStyle.has('UNDERLINE')) {
            editorState = RichUtils.toggleInlineStyle(editorState, 'UNDERLINE');
            return editorState
        }
        if (currentStyle.has('red')) {
            editorState = RichUtils.toggleInlineStyle(editorState, 'red');
            return editorState
        }
        if (currentStyle.has('code')) {
            editorState = RichUtils.toggleInlineStyle(editorState, 'code');
            return editorState
        }
        return editorState
    }

    const handleKeyCommand = (command: string, editorState: EditorState) => {

        if (command === "set-header") {
            editorState = removeCharacter(editorState, "#")
            editorState = reset(editorState)
            handleChange(RichUtils.toggleBlockType(
                editorState,
                'header-one'
            ))
            return 'handled'
        }
        if (command === "set-bold") {
            editorState = removeCharacter(editorState, "*")
            editorState = reset(editorState)
            handleChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'))
            return 'handled'
        }
        if (command === "set-underline") {
            editorState = removeCharacter(editorState, "***")
            editorState = reset(editorState)
            handleChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'))
            return 'handled'
        }
        if (command === "set-redline") {
            editorState = removeCharacter(editorState, "**")
            editorState = reset(editorState)
            // Let's just allow one color at a time. Turn off all active colors.
            const nextContentState = editorState.getCurrentContent()

            const nextEditorState = EditorState.push(
                editorState,
                nextContentState,
                'change-inline-style'
            );

            handleChange(RichUtils.toggleInlineStyle(
                nextEditorState,
                "red"
            ))
            return 'handled'
        }
        if (command === "set-highlighted-code") {
            editorState = removeCharacter(editorState, "```")
            editorState = reset(editorState)
            handleChange(RichUtils.toggleInlineStyle(
                editorState,
                'code'
            ))
            return 'handled'
        }

        return 'not-handled';
    };

    const removeCharacter = (newEditorState: EditorState, string: string) => {
        const selectionState = newEditorState.getSelection();
        const contentState = newEditorState.getCurrentContent();
        const newContentState = Modifier.removeRange(
            contentState,
            selectionState.merge({
                anchorOffset: 0,
                focusOffset: string.length,
            }),
            'backward'
        );
        const newEditorStateWithRemovedChar = EditorState.push(editorState, newContentState, 'remove-range');
        return newEditorStateWithRemovedChar
    }

    const keyBindingFn = (e:  React.KeyboardEvent) => {
        if (e.keyCode === 32) {
            const selection = editorState.getSelection();
            const contentState = editorState.getCurrentContent();
            const block = contentState.getBlockForKey(selection.getStartKey());
            const blockText = block.getText();

            if (blockText === '#') {
                return 'set-header';
            }
            else if (blockText === '*') {
                return 'set-bold';
            } else if (blockText === '**') {
                return 'set-redline';
            } else if (blockText === '***') {
                return 'set-underline';
            } else if (blockText === '```') {
                return 'set-highlighted-code';
            }
        }
        return getDefaultKeyBinding(e);
    };

    const saveData = () => {
        const contentState = editorState.getCurrentContent();
        const contentStateJSON = JSON.stringify(convertToRaw(contentState));
        localStorage.setItem('draftjs_content', contentStateJSON);
        setLoading(true);
        setTimeout(()=>{
            setLoading(false);
        }, 1000)
    };

    const loadData = (savedData: string) => {
        if (savedData) {
            const rawContentState = JSON.parse(savedData);
            const contentState = convertFromRaw(rawContentState);
            setEditorState(EditorState.createWithContent(contentState));
        }
    };

    useEffect(() => {
        const savedData = localStorage.getItem('draftjs_content');
        if (savedData)
            loadData(savedData)
    }, [])

    return (
        <div className="container">
            <div className='header'>
                <h1 className="project-title">Demo editor by Ankith T V</h1>
                <button className={`save action-button ${loading ? 'loading' : ''}`} onClick={saveData}>
                    {loading ? <span className="loader"></span>: "Save"}</button>
            </div>
            <div className='editor-container'>
                <Editor
                    customStyleMap={colorStyleMap}
                    editorState={editorState}
                    onChange={handleChange}
                    handleKeyCommand={handleKeyCommand}
                    keyBindingFn={keyBindingFn}
                />
            </div>
        </div>
    );
};

export default CustomEditor;
