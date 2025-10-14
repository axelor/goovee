import type {LexicalEditor} from 'lexical';
import type {JSX} from 'react';

import {
  editorStateFromSerializedDocument,
  exportFile,
  importFile,
  SerializedDocument,
  serializedDocumentFromEditorState,
} from '@lexical/file';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $getRoot,
  $isParagraphNode,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
} from 'lexical';
import {useEffect, useState} from 'react';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {useParams, useRouter} from 'next/navigation';
import {updateWikiContent} from '@/subapps/website/common/action';
import useFlashMessage from '../../hooks/useFlashMessage';
import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import {docFromHash, docToHash} from '../../utils/docSerialization';
import {
  SPEECH_TO_TEXT_COMMAND,
  SUPPORT_SPEECH_RECOGNITION,
} from '../SpeechToTextPlugin';

async function shareDoc(doc: SerializedDocument): Promise<void> {
  const url = new URL(window.location.toString());
  url.hash = await docToHash(doc);
  const newUrl = url.toString();
  window.history.replaceState({}, '', newUrl);
  await window.navigator.clipboard.writeText(newUrl);
}

export default function ActionsPlugin({
  contentId,
  contentVersion,
}: {
  contentId: string;
  contentVersion: number;
}): JSX.Element {
  const {workspaceURL} = useWorkspace();

  const params = useParams();
  const {toast} = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [modal, showModal] = useModal();
  const showFlashMessage = useFlashMessage();

  async function save() {
    if (saving) return;
    const content = editor.getEditorState().toJSON();
    setSaving(true);
    try {
      const {error, message} = await updateWikiContent({
        workspaceURL,
        websiteSlug: params.websiteSlug as string,
        websitePageSlug: params.websitePageSlug as string,
        contentId,
        contentVersion,
        content: JSON.stringify(content),
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: message || i18n.t('Something went wrong'),
        });
        return;
      }
      toast({
        variant: 'success',
        title: i18n.t('Saved successfully'),
      });
      router.refresh();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: i18n.t('Something went wrong'),
      });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    docFromHash(window.location.hash).then(doc => {
      if (doc && doc.source === 'Playground') {
        editor.setEditorState(editorStateFromSerializedDocument(editor, doc));
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      }
    });
  }, [editor]);
  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener(editable => {
        setIsEditable(editable);
      }),
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(
      ({dirtyElements, prevEditorState, tags}) => {
        // If we are in read only mode, send the editor state
        // to server and ask for validation if possible.
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      },
    );
  }, [editor, isEditable]);

  return (
    <div className="actions">
      {isEditable && (
        <>
          <button className="action-button" onClick={save} disabled={saving}>
            <i className="save" />
          </button>
          {SUPPORT_SPEECH_RECOGNITION && (
            <button
              onClick={() => {
                editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
                setIsSpeechToText(!isSpeechToText);
              }}
              className={
                'action-button action-button-mic ' +
                (isSpeechToText ? 'active' : '')
              }
              title="Speech To Text"
              aria-label={`${
                isSpeechToText ? 'Enable' : 'Disable'
              } speech to text`}>
              <i className="mic" />
            </button>
          )}
          <button
            className="action-button import"
            onClick={() => importFile(editor)}
            title="Import"
            aria-label="Import editor state from JSON">
            <i className="import" />
          </button>
          <button
            className="action-button export"
            onClick={() =>
              exportFile(editor, {
                fileName: `Playground ${new Date().toISOString()}`,
                source: 'Playground',
              })
            }
            title="Export"
            aria-label="Export editor state to JSON">
            <i className="export" />
          </button>
          <button
            className="action-button share"
            onClick={() =>
              shareDoc(
                serializedDocumentFromEditorState(editor.getEditorState(), {
                  source: 'Playground',
                }),
              ).then(
                () => showFlashMessage('URL copied to clipboard'),
                () => showFlashMessage('URL could not be copied to clipboard'),
              )
            }
            title="Share"
            aria-label="Share Playground link to current editor state">
            <i className="share" />
          </button>
          <button
            className="action-button clear"
            disabled={isEditorEmpty}
            onClick={() => {
              showModal('Clear editor', onClose => (
                <ShowClearDialog editor={editor} onClose={onClose} />
              ));
            }}
            title="Clear"
            aria-label="Clear editor contents">
            <i className="clear" />
          </button>
        </>
      )}
      <button
        className={`action-button ${!isEditable ? 'unlock' : 'lock'}`}
        onClick={() => {
          editor.setEditable(!editor.isEditable());
        }}
        title={!isEditable ? 'Edit' : 'Lock'}
        aria-label={!isEditable ? 'Edit' : 'Lock'}>
        <i className={!isEditable ? 'edit' : 'lock'} />
      </button>
      {modal}
    </div>
  );
}

function ShowClearDialog({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  return (
    <>
      Are you sure you want to clear the editor?
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          Clear
        </Button>{' '}
        <Button
          onClick={() => {
            editor.focus();
            onClose();
          }}>
          Cancel
        </Button>
      </div>
    </>
  );
}
