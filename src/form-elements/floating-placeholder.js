(function (window, document) {
  'use strict';

  const CSS_ID = 'floating-placeholder-styles';

  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    const css = `
.floating-input-wrapper{position:relative}
.floating-input-wrapper .fb-placeholder{
  position:absolute;
  left:.75rem;
  top:50%;
  transform:translateY(-50%);
  transition:all .15s ease;
  color: #6c757d;
  pointer-events:none;
  font-size:1rem;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.floating-input-wrapper .fb-placeholder.shrunken{
  top:.25rem;
  transform:none;
  font-size:.75rem;
  color:#495057;
}
.floating-input-wrapper.has-placeholder input.form-control,
.floating-input-wrapper.has-placeholder textarea.form-control{
  padding-top:1.5rem;
}
`;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  function processWrapper(wrapper) {
    if (!wrapper) return;
    const input = wrapper.querySelector('input, textarea');
    if (!input) return;

    // find existing placeholder span or derive placeholder text
    let placeholderSpan = wrapper.querySelector('.fb-placeholder');
    const derivedPlaceholder = input.getAttribute('data-placeholder') || input.getAttribute('placeholder') || '';

    // if span not present but placeholder text exists, create it
    if (!placeholderSpan && derivedPlaceholder) {
      placeholderSpan = document.createElement('span');
      placeholderSpan.className = 'fb-placeholder';
      placeholderSpan.textContent = derivedPlaceholder;
      wrapper.appendChild(placeholderSpan);
    }

    if (placeholderSpan) wrapper.classList.add('has-placeholder');

    const update = () => {
      const val = input.value;
      if (!placeholderSpan) return;
      if (val && String(val).length > 0) {
        placeholderSpan.classList.add('shrunken');
      } else if (document.activeElement === input) {
        // keep shrunken while focused
        placeholderSpan.classList.add('shrunken');
      } else {
        placeholderSpan.classList.remove('shrunken');
      }
    };

    input.addEventListener('input', update);
    input.addEventListener('focus', () => {
      wrapper.classList.add('focused');
      update();
    });
    input.addEventListener('blur', () => {
      wrapper.classList.remove('focused');
      update();
    });

    // clicking the wrapper focuses inner input
    wrapper.addEventListener('click', (e) => {
      // allow clicks on other controls inside wrapper
      if (e.target === wrapper || e.target === placeholderSpan) {
        input.focus();
      }
    });

    // initial state
    update();
  }

  function init(options) {
    options = options || {};
    if (options.injectStyles !== false) injectStyles();
    const wrappers = document.querySelectorAll('.floating-input-wrapper');
    wrappers.forEach(processWrapper);
  }

  // auto init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    // run on next tick
    setTimeout(() => init(), 0);
  }

  // expose API
  window.FloatingPlaceholder = {
    init,
  };
})(window, document);
