import React, { useEffect, useState } from 'react';
import { Editor, EditorState, Modifier, RichUtils, getDefaultKeyBinding, convertFromRaw, convertToRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import "./Editor.css";

const colorStyleMap = {
    red: {
      color: 'rgba(255, 0, 0, 1.0)',
    },
}
const CustomEditor = () => {
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

    const handleChange = (newEditorState: EditorState) => {
        setEditorState(newEditorState);
    };

    const handleKeyCommand = (command, editorState) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            handleChange(newState);
            return 'handled';
        }

        return 'not-handled';
    };

    const applyColor = (editorState: EditorState) => {

        // Let's just allow one color at a time. Turn off all active colors.
        const nextContentState = editorState.getCurrentContent()

        let nextEditorState = EditorState.push(
            editorState,
            nextContentState,
            'change-inline-style'
        );



        nextEditorState = RichUtils.toggleInlineStyle(
            nextEditorState,
            "red"
        );
        return nextEditorState
    }

    const removeCharacter = (newEditorState: EditorState, string: string)=> {
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

    const keyBindingFn = (e) => {
        if (e.keyCode === 32) { // Space key
            const selection = editorState.getSelection();
            const contentState = editorState.getCurrentContent();
            const block = contentState.getBlockForKey(selection.getStartKey());
            const blockText = block.getText();

            const newEditorState = removeCharacter(editorState, blockText)
            if (blockText === '#') {
                handleChange(RichUtils.toggleBlockType(
                    newEditorState,
                    'header-one'
                ))
            }
            else if (blockText === '*') {
                handleChange(RichUtils.toggleInlineStyle(newEditorState, 'BOLD'))
            } else if (blockText === '**') {
                handleChange(applyColor(newEditorState))
            } else if (blockText === '***') {
                handleChange(RichUtils.toggleInlineStyle(newEditorState, 'UNDERLINE'))
            }
        }
        return getDefaultKeyBinding(e);
    };

    const saveData = () => {
        const contentState = editorState.getCurrentContent();
        const contentStateJSON = JSON.stringify(convertToRaw(contentState));
        localStorage.setItem('draftjs_content', contentStateJSON);
      };
    
      const loadData = (savedData: string) => {
        if (savedData) {
          const rawContentState = JSON.parse(savedData);
          const contentState = convertFromRaw(rawContentState);
          setEditorState(EditorState.createWithContent(contentState));
        }
      };

      useEffect(()=> {
        const savedData = localStorage.getItem('draftjs_content');
        if(savedData)
            loadData(savedData)
      },[])

    return (
        <div className='editor-container'>
            <Editor
                customStyleMap={colorStyleMap}
                editorState={editorState}
                onChange={handleChange}
                handleKeyCommand={handleKeyCommand}
                keyBindingFn={keyBindingFn}
            />
            <button
                onClick={saveData}
            >Save</button>
        </div>
    );
};

export default CustomEditor;
