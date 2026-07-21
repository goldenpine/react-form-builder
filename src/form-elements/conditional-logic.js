(function (window, document) {
  'use strict';

  function normalizePrimitive(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return String(value || '');
  }

  function toComparableString(value) {
    const normalized = Array.isArray(value) ? value.map(item => normalizePrimitive(item).toLowerCase()) : normalizePrimitive(value).toLowerCase();
    return normalized;
  }

  function getElementValue(element) {
    if (!element) return undefined;

    if (element.type === 'checkbox' || element.type === 'radio') {
      if (!element.checked) return undefined;
      return element.value;
    }

    if (element.multiple && element.tagName === 'SELECT') {
      const selected = [];
      Array.prototype.forEach.call(element.options, option => {
        if (option.selected) {
          selected.push(option.value || option.text || '');
        }
      });
      return selected;
    }

    if (element.tagName === 'SELECT') {
      return element.value;
    }

    return element.value;
  }

  function findClosestFieldContainer(fieldName, root) {
    if (!fieldName || !root) return null;

    const selectors = [
      `[data-field-name="${fieldName}"]`,
      `[name="${fieldName}"]`,
      `[id="${fieldName}"]`,
    ];

    for (let i = 0; i < selectors.length; i += 1) {
      const matched = root.querySelector(selectors[i]);
      if (matched) {
        const parent = matched.closest('.form-group, .rfb-item, .field, .form-field, .SortableItem');
        return parent || matched;
      }
    }

    const allControls = root.querySelectorAll('input, select, textarea');
    for (let i = 0; i < allControls.length; i += 1) {
      const control = allControls[i];
      const name = control.getAttribute('name') || control.getAttribute('id') || '';
      if (name === fieldName) {
        const parent = control.closest('.form-group, .rfb-item, .field, .form-field, .SortableItem');
        return parent || control;
      }
    }

    return null;
  }

  function getFieldValueByName(fieldName, root) {
    if (!fieldName || !root) return undefined;

    const control = root.querySelector(`[name="${fieldName}"]`) || root.querySelector(`[data-field-name="${fieldName}"]`) || root.querySelector(`[id="${fieldName}"]`);
    if (!control) return undefined;

    const value = getElementValue(control);
    if (value !== undefined) return value;

    const collection = root.querySelectorAll(`[name="${fieldName}"]`);
    if (collection && collection.length > 1) {
      const values = [];
      Array.prototype.forEach.call(collection, item => {
        const itemValue = getElementValue(item);
        if (itemValue !== undefined) {
          values.push(itemValue);
        }
      });
      return values;
    }

    return undefined;
  }

  function evaluateRule(rule, root) {
    const left = getFieldValueByName(rule.field, root);
    const right = rule.value;
    const op = (rule.operator || '==').toString();

    if (left === undefined || left === null) return false;

    if (Array.isArray(left)) {
      const normalizedLeft = left.map(value => normalizePrimitive(value).toLowerCase());
      const normalizedRight = normalizePrimitive(right).toLowerCase();

      if (op === 'contains') return normalizedLeft.some(value => value.includes(normalizedRight));
      if (op === 'not_contains') return !normalizedLeft.some(value => value.includes(normalizedRight));
      if (op === 'starts_with') return normalizedLeft.some(value => value.startsWith(normalizedRight));
      if (op === 'ends_with') return normalizedLeft.some(value => value.endsWith(normalizedRight));
      if (op === '==') return normalizedLeft.some(value => value === normalizedRight);
      if (op === '!=') return !normalizedLeft.some(value => value === normalizedRight);
    }

    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);
    if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
      if (op === '>') return leftNum > rightNum;
      if (op === '>=') return leftNum >= rightNum;
      if (op === '<') return leftNum < rightNum;
      if (op === '<=') return leftNum <= rightNum;
      if (op === '==') return leftNum === rightNum;
      if (op === '!=') return leftNum !== rightNum;      
    }

    const leftString = normalizePrimitive(left).toLowerCase();
    const rightString = normalizePrimitive(right).toLowerCase();

    switch (op) {

      case 'contains':
        return leftString.indexOf(rightString) > -1;
      case 'not_contains':
        return leftString.indexOf(rightString) === -1;
      case 'starts_with':
        return leftString.startsWith(rightString);
      case 'ends_with':
        return leftString.endsWith(rightString);
      case '==':
        return leftString === rightString;
      case '!=':
        return leftString !== rightString;        
      default:
        return false;
    }
  }

  function evaluateCondition(item, root) {
    if (!item || !item.conditional) return true;

    const cond = item.conditional;
    const rules = cond.rules || [];
    if (!rules.length) return true;

    const logic = (cond.logic || 'AND').toUpperCase();
    const results = rules.map(rule => evaluateRule(rule, root));
    const passed = logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
    const action = (cond.action || 'SHOW').toUpperCase();
    return action === 'HIDE' ? !passed : passed;
  }

  function applyConditionalVisibility(item, root, formData) {
    const fieldName = item.field_name || item.name || item.custom_name;
    const container = findClosestFieldContainer(fieldName, root);
    if (!container) return;

    const visible = evaluateCondition(item, root, formData);
    container.style.display = visible ? '' : 'none';
    container.setAttribute('data-rfb-conditional-visible', visible ? 'true' : 'false');
  }

  function bindFormEvents(form, formData) {
    const inputs = form.querySelectorAll('input, select, textarea');
    Array.prototype.forEach.call(inputs, input => {
      input.addEventListener('input', () => refreshVisibility(form, formData));
      input.addEventListener('change', () => refreshVisibility(form, formData));
    });
  }

  function refreshVisibility(root, formData) {
    if (!formData || !formData.length) return;
    formData.forEach(item => {
      applyConditionalVisibility(item, root, formData);
    });
  }

  function init(options) {
    options = options || {};
    const root = options.root || document;
    const formSelector = options.formSelector || '.form-builder-form, form';
    const resolveFormData = () => {
      if (options.formData) return options.formData;
      if (window.__RFB_FORM_DATA__) return window.__RFB_FORM_DATA__;
      if (window.__FORM_DATA__) return window.__FORM_DATA__;
      const script = document.querySelector('[data-rfb-form-data]');
      if (script) {
        try {
          return JSON.parse(script.textContent || script.innerHTML || '[]');
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    const formData = resolveFormData();
    const forms = root.querySelectorAll(formSelector);

    if (!forms.length) {
      refreshVisibility(root, formData);
      return;
    }

    Array.prototype.forEach.call(forms, form => {
      if (!form.__conditionalLogicBound) {
        bindFormEvents(form, formData);
        form.__conditionalLogicBound = true;
      }
      refreshVisibility(form, formData);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    setTimeout(() => init(), 0);
  }

  window.ConditionalLogic = {
    init,
    evaluateRule,
    evaluateCondition,
    refreshVisibility,
    getFieldValueByName,
  };
})(window, document);
