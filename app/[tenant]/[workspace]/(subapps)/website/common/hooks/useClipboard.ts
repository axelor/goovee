import ClipboardJS from 'clipboard';
import {useEffect, useRef} from 'react';

const useClipboard = () => {
  const clipboard = useRef<ClipboardJS | undefined>(undefined);
  const copyIconCode = useRef<ClipboardJS | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const ClipboardJS = (await import('clipboard')).default;

      const btnHtml =
        '<button type="button" class="btn btn-sm btn-white rounded-pill btn-clipboard">Copy</button>';
      document
        .querySelectorAll('.code-wrapper-inner')
        .forEach(function (element) {
          element.insertAdjacentHTML('beforebegin', btnHtml);
        });

      clipboard.current = new ClipboardJS('.btn-clipboard', {
        target: function (trigger) {
          return trigger.nextElementSibling as Element;
        },
      });

      clipboard.current.on('success', event => {
        event.trigger.textContent = 'Copied!';
        event.clearSelection();
        const timeout = setTimeout(function () {
          event.trigger.textContent = 'Copy';
        }, 2000);

        return () => clearTimeout(timeout);
      });

      copyIconCode.current = new ClipboardJS('.btn-copy-icon');

      copyIconCode.current.on('success', function (event) {
        event.clearSelection();
        event.trigger.textContent = 'Copied!';
        const timeout = setTimeout(function () {
          event.trigger.textContent = 'Copy';
        }, 2300);

        return () => clearTimeout(timeout);
      });
    })();

    return () => {
      clipboard.current?.destroy();
      copyIconCode.current?.destroy();
    };
  }, []);

  return null;
};

export default useClipboard;
