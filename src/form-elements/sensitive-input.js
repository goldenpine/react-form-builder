(function (window, document) {
  'use strict';

  const CSS_ID = 'sensitive-input-styles';

  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    const css = `
.sensitive-wrapper { position: relative; }
.sensitive-wrapper .toggle-password{
  position: absolute;
  right: .75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  background: transparent;
  border: none;
  padding: 0;
  font-size: 1rem;
}
.sensitive-wrapper input.form-control{
  padding-right: 2.5rem;
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
    const input = wrapper.querySelector('input');
    if (!input) return;

    // ensure initial type is password unless explicitly text
    try {
      if (!input.getAttribute('data-initial-type')) {
        input.setAttribute('data-initial-type', input.type || 'password');
      }
      if (!input.type) input.type = 'password';
    } catch (e) {
      // ignore
    }

    // find existing toggle or create one
    let toggle = wrapper.querySelector('.toggle-password');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'toggle-password';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('title', 'Show password');
      // prefer icon if FontAwesome present
      toggle.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
      wrapper.appendChild(toggle);
    }

    function setShown(shown) {
      try {
        input.type = shown ? 'text' : 'password';
      } catch (err) {
        // some browsers don't allow changing type — replace element as fallback
        const newInput = input.cloneNode(true);
        newInput.type = shown ? 'text' : 'password';
        input.parentNode.replaceChild(newInput, input);
      }
      toggle.setAttribute('aria-pressed', shown ? 'true' : 'false');
      toggle.setAttribute('title', shown ? 'Hide password' : 'Show password');
      // update icon if present
      const i = toggle.querySelector('i');
      if (i) {
        if (shown) {
          i.classList.remove('fa-eye');
          i.classList.add('fa-eye-slash');
        } else {
          i.classList.remove('fa-eye-slash');
          i.classList.add('fa-eye');
        }
      }
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const currentlyShown = toggle.getAttribute('aria-pressed') === 'true';
      setShown(!currentlyShown);
      // keep focus in the input for accessibility
      try { input.focus(); } catch (err) {}
    });

    // initialize state
    setShown(false);
  }

  function init(options) {
    options = options || {};
    if (options.injectStyles !== false) injectStyles();
    const wrappers = document.querySelectorAll('.sensitive-wrapper');
    wrappers.forEach(processWrapper);
  }

  // auto init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    setTimeout(() => init(), 0);
  }

  window.SensitiveInput = { init };
})(window, document);
