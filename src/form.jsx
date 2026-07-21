/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
/**
  * <Form />
  */

import React from 'react';
import { EventEmitter } from 'fbemitter';
import { injectIntl } from 'react-intl';
import FormValidator from './form-validator';
import FormElements from './form-elements';
import { TwoColumnRow, ThreeColumnRow, MultiColumnRow } from './multi-column';
import { FieldSet } from './fieldset';
import CustomElement from './form-elements/custom-element';
import Registry from './stores/registry';

const {
  Image, Checkboxes, Signature, Download, Camera, FileUpload,
} = FormElements;

class ReactForm extends React.Component {
  form;

  inputs = {};

  answerData;

  constructor(props) {
    super(props);
    this.answerData = this._convert(props.answer_data);
    this.emitter = new EventEmitter();
    this.getDataById = this.getDataById.bind(this);

    // Bind handleBlur and handleChange methods
    this.handleBlur = this.handleBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    try {
      this.forceUpdate();
    } catch (e) {
      // ignore
    }
  }

  _convert(answers) {
    if (Array.isArray(answers)) {
      const result = {};
      answers.forEach(x => {
        if (x.name.indexOf('tags_') > -1) {
          result[x.name] = x.value.map(y => y.value);
        } else {
          result[x.name] = x.value;
        }
      });
      return result;
    }
    return answers || {};
  }

  _getDefaultValue(item) {
    if (!item) return undefined;
    const explicitDefault = item.defaultValue ?? item.default_value ?? item.value;
    if (explicitDefault !== undefined && explicitDefault !== null && explicitDefault !== '') {
      return explicitDefault;
    }
    return this.answerData[item.field_name];
  }

  _optionsDefaultValue(item) {
    const defaultValue = this._getDefaultValue(item);
    if (defaultValue) {
      return defaultValue;
    }

    const defaultChecked = [];
    item.options.forEach(option => {
      if (this.answerData[`option_${option.key}`]) {
        defaultChecked.push(option.key);
      }
    });
    return defaultChecked;
  }

  _getItemValue(item, ref, trimValue) {
    let $item = {
      element: item.element,
      value: '',
    };
    if (item.element === 'Rating') {
      $item.value = ref.inputField.current.state.rating;
    } else if (item.element === 'Tags') {
      $item.value = ref.inputField.current.state.value;
    } else if (item.element === 'DatePicker') {
      $item.value = ref.state.value;
    } else if (item.element === 'Camera') {
      $item.value = ref.state.img;
    } else if (item.element === 'FileUpload') {
      $item.value = ref.state.fileUpload;
    } else if (item.element === 'Range') {
      $item.value = ref && ref.state ? ref.state.value : undefined;
    } else if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
      const checked = [];
      if (ref && ref.options) {
        item.options.forEach(option => {
          const $option = ref.options[`child_ref_${option.key}`];
          if ($option && $option.checked) {
            checked.push(option.value);
          }
        });
      }
      $item.value = checked;
    } else if (ref && ref.inputField && ref.inputField.current) {
      $item = ref.inputField.current;
      if (trimValue && $item && typeof $item.value === 'string') {
        $item.value = $item.value.trim();
      }
    }
    return $item;
  }

  _getOptionKeyValue = (option) => {
    return this.props.option_key_value === 'value' ?
      option.value : option.key;
  }

  _isIncorrect(item) {
    let incorrect = false;
    if (item.canHaveAnswer) {
      const ref = this.inputs[item.field_name];
      if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
        item.options.forEach(option => {
          const $option = ref.options[`child_ref_${option.key}`];
          if ((option.hasOwnProperty('correct') && !$option.checked) || (!option.hasOwnProperty('correct') && $option.checked)) {
            incorrect = true;
          }
        });
      } else {
        const $item = this._getItemValue(item, ref);
        if (item.element === 'Rating') {
          if ($item.value.toString() !== item.correct) {
            incorrect = true;
          }
        } else if ($item.value.toLowerCase() !== item.correct.trim().toLowerCase()) {
          incorrect = true;
        }
      }
    }
    return incorrect;
  }

  _isInvalid(item) {
    let invalid = false;
    if (item.required === true) {
      const ref = this.inputs[item.field_name];
      if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
        let checked_options = 0;
        item.options.forEach(option => {
          const $option = ref.options[`child_ref_${option.key}`];
          if ($option.checked) {
            checked_options += 1;
          }
        });
        if (checked_options < 1) {
          // errors.push(item.label + ' is required!');
          invalid = true;
        }
      } else {
        const $item = this._getItemValue(item, ref);
        if (item.element === 'Rating') {
          if ($item.value === 0) {
            invalid = true;
          }
        } else if ($item.value === undefined || $item.value.length < 1) {
          invalid = true;
        }
      }
    }
    return invalid;
  }

  _collect(item, trimValue) {
    const itemData = {
      id: item.id,
      name: item.field_name,
      custom_name: item.custom_name || item.field_name,
    };
    if (!itemData.name) return null;
    const ref = this.inputs[item.field_name];
    if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
      const checked_options = [];
      item.options.forEach(option => {
        const $option = ref.options[`child_ref_${option.key}`];
        if ($option.checked) {
          checked_options.push(this._getOptionKeyValue(option));
        }
      });
      itemData.value = checked_options;
    } else {
      if (!ref) return null;
      itemData.value = this._getItemValue(item, ref, trimValue).value;
    }
    return itemData;
  }

  _collectFormData(data, trimValue) {
    const formData = [];
    // only collect visible items (respect conditional logic)
    (data || []).filter(i => this._evaluateCondition(i)).forEach(item => {
      const item_data = this._collect(item, trimValue);
      if (item_data) {
        formData.push(item_data);
      }
    });
    return formData;
  }

  _getSignatureImg(item) {
    const ref = this.inputs[item.field_name];
    const $canvas_sig = ref.canvas.current;
    if ($canvas_sig) {
      const base64 = $canvas_sig.toDataURL().replace('data:image/png;base64,', '');
      const isEmpty = $canvas_sig.isEmpty();
      const $input_sig = ref.inputField.current;
      if (isEmpty) {
        $input_sig.value = '';
      } else {
        $input_sig.value = base64;
      }
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    let errors = [];
    if (!this.props.skip_validations) {
      errors = this.validateForm();
      // Publish errors, if any.
      this.emitter.emit('formValidation', errors);
    }

    // Only submit if there are no errors.
    if (errors.length < 1) {
      const { onSubmit } = this.props;
      if (onSubmit) {
        const data = this._collectFormData(this.props.data, true);
        onSubmit(data);
      } else {
        const $form = this.form;
        $form.submit();
      }
    }
  }

   handleBlur() {
    // Call submit function on blur
    if (this.props.onBlur) {
      const { onBlur } = this.props;
      const data = this._collectFormData(this.props.data, true);
      onBlur(data);
    }
  }

  handleChange() {
    // Call submit function on change
    if (this.props.onChange) {
      const { onChange } = this.props;
      const data = this._collectFormData(this.props.data, false);
      onChange(data);
    }
    // re-render to apply conditional logic visibility
    try { this.forceUpdate(); } catch (e) { /* ignore */ }
  }

  validateForm() {
    const errors = [];
    let data_items = this.props.data;
    const { intl } = this.props;

    if (this.props.display_short) {
      data_items = this.props.data.filter((i) => i.alternateForm === true);
    }

    // apply conditional visibility filtering
    data_items = data_items.filter(i => this._evaluateCondition(i));

    data_items.forEach(item => {
      if (item.element === 'Signature') {
        this._getSignatureImg(item);
      }

      if (this._isInvalid(item)) {
        errors.push(`${item.label} ${intl.formatMessage({ id: 'message.is-required' })}!`);
      }

      if (item.element === 'EmailInput') {
        const ref = this.inputs[item.field_name];
        const emailValue = this._getItemValue(item, ref).value;
        if (emailValue) {
            const validateEmail = (email) => email.match(
              // eslint-disable-next-line no-useless-escape
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
          const checkEmail = validateEmail(emailValue);
          if (!checkEmail) {
            errors.push(`${item.label} ${intl.formatMessage({ id: 'message.invalid-email' })}`);
          }
        }
      }

      if (item.element === 'PhoneNumber') {
        const ref = this.inputs[item.field_name];
        const phoneValue = this._getItemValue(item, ref).value;
        if (phoneValue) {
          const validatePhone = (phone) => phone.match(
            // eslint-disable-next-line no-useless-escape
            /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/g
          );
          const checkPhone = validatePhone(phoneValue);
          if (!checkPhone) {
            errors.push(`${item.label} ${intl.formatMessage({ id: 'message.invalid-phone-number' })}`);
          }
        }
      }

      if (this.props.validateForCorrectness && this._isIncorrect(item)) {
        errors.push(`${item.label} ${intl.formatMessage({ id: 'message.was-answered-incorrectly' })}!`);
      }
    });

    return errors;
  }

  getDataById(id) {
    const { data } = this.props;
    return data.find(x => x.id === id);
  }

  _getFieldValueByName(fieldName) {
    if (!fieldName) return undefined;
    const item = (this.props.data || []).find(x => x.field_name === fieldName);
    const ref = this.inputs[fieldName];
    if (item && ref) {
      const refValue = this._getItemValue(item, ref).value;
      if (refValue !== undefined && refValue !== null && refValue !== '') {
        return refValue;
      }
    }
    const defaultValue = this._getDefaultValue(item);
    if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
      return defaultValue;
    }
    if (this.answerData && Object.prototype.hasOwnProperty.call(this.answerData, fieldName)) {
      return this.answerData[fieldName];
    }
    return undefined;
  }

  _evaluateRule(rule) {
    const left = this._getFieldValueByName(rule.field);
    const right = rule.value;
    const op = (rule.operator || '==').toString();
    if (left === undefined || left === null) return false;
    if (Array.isArray(left)) {
      const normalizedLeft = left.map(value => value.toString().toLowerCase());
      const normalizedRight = right.toString().toLowerCase();
      if (op === 'contains') return normalizedLeft.some(value => value.includes(normalizedRight));
      if (op === 'not_contains') return !normalizedLeft.some(value => value.includes(normalizedRight));
      if (op === 'starts_with') return normalizedLeft.some(value => value.startsWith(normalizedRight));
      if (op === 'ends_with') return normalizedLeft.some(value => value.endsWith(normalizedRight));
    }
    // The value of a checkbox or radio button is an array, the former may be an array of multiple values, the latter is an array of a single value. 
    // parseFloat() will call toString() on the array, which will convert it to a comma-separated string. 
    // And then parseFloat() will parse the string until it encounters a non-numeric character, which will be the comma, and return the number before the comma.
    // So for the single element array, parseFloat() will return the number, 
    // but for the multiple element array, parseFloat() will return the number before the first comma, which will make the following comparision confusing.
    // Currently we leave it as is, but we may need to consider how to handle the case where the left value is an array of multiple values in the future.
    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);
    if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
      if (op === '>' ) return leftNum > rightNum;
      if (op === '>=' ) return leftNum >= rightNum;
      if (op === '<' ) return leftNum < rightNum;
      if (op === '<=' ) return leftNum <= rightNum;
      if (op === '==') return leftNum === rightNum;
      if (op === '!=') return leftNum !== rightNum;
    }
    const leftString = left.toString().toLowerCase();
    const rightString = right.toString().toLowerCase();
    switch (op) {
      case 'contains':
        return leftString.includes(rightString);
      case 'not_contains':
        return !leftString.includes(rightString);
      case 'starts_with':
        return leftString.startsWith(rightString);
      case 'ends_with':
        return leftString.endsWith(rightString);
      case '==' :
        return leftString === rightString;
      case '!=':
        return leftString !== rightString;
      default:
        return false;
    }
  }

  _evaluateCondition(item) {
    // Conditional logic can be explicitly disabled
    if (this.props.skip_conditional_logic === true) return true;

    if (!item || !item.conditional) return true;
    const cond = item.conditional;
    const rules = cond.rules || [];
    if (!rules.length) return true;
    const logic = (cond.logic || 'AND').toUpperCase();
    const results = rules.map(r => this._evaluateRule(r));
    let ok = logic === 'AND' ? results.every(x => x) : results.some(x => x);
    const action = (cond.action || 'SHOW').toUpperCase();
    if (action === 'HIDE') ok = !ok;
    return ok;
  }

  getInputElement(item) {
    if (item.custom) {
      return this.getCustomElement(item);
    }
    const Input = FormElements[item.element];
    return (<Input
      handleChange={this.handleChange}
      ref={c => this.inputs[item.field_name] = c}
      mutable={true}
      key={`form_${item.id}`}
      data={item}
      read_only={this.props.read_only}
      defaultValue={this._getDefaultValue(item)} />);
  }

  getContainerElement(item, Element) {
    // When react-form-builder is used in a React app, adding a Fieldset to the canvas will cause the form to crash
    // because its childItems is undefined. So the below code is adjusted to prevent the crash by using an empty array when it's undefined.
    const controls = (item.childItems || []).map(x => {
      if (!x) return <div>&nbsp;</div>;
      const child = this.getDataById(x);
      if (!child) return <div>&nbsp;</div>;
      return this._evaluateCondition(child) ? this.getInputElement(child) : <div key={`empty_${x}`}>&nbsp;</div>;
    });
    return (<Element mutable={true} key={`form_${item.id}`} data={item} controls={controls} />);
  }

  getSimpleElement(item) {
    const Element = FormElements[item.element];
    return (<Element mutable={true} key={`form_${item.id}`} data={item} />);
  }

  getCustomElement(item) {
    const { intl } = this.props;

    if (!item.component || typeof item.component !== 'function') {
      item.component = Registry.get(item.key);
      if (!item.component) {
        console.error(`${item.element} ${intl.formatMessage({ id: 'message.was-not-registered' })}`);
      }
    }

    const inputProps = item.forwardRef && {
      handleChange: this.handleChange,
      defaultValue: this._getDefaultValue(item),
      ref: c => this.inputs[item.field_name] = c,
    };
    return (
      <CustomElement
        mutable={true}
        read_only={this.props.read_only}
        key={`form_${item.id}`}
        data={item}
        {...inputProps}
      />
    );
  }

  handleRenderSubmit = () => {
    const name = this.props.action_name || this.props.actionName;
    const actionName = name || 'Submit';
    const { submitButton = false } = this.props;

    return submitButton || <input type='submit' className='btn btn-big' value={actionName} />;
  }

  handleRenderBack = () => {
    const name = this.props.back_name || this.props.backName;
    const backName = name || 'Cancel';
    const { backButton = false } = this.props;

    return backButton || <a href={this.props.back_action} className='btn btn-secondary btn-cancel btn-big'>{backName}</a>;
  }

  render() {
    let data_items = this.props.data;

    if (this.props.display_short) {
      data_items = this.props.data.filter((i) => i.alternateForm === true);
    }

    data_items.forEach((item) => {
      if (item && item.readOnly && item.variableKey && this.props.variables[item.variableKey]) {
        this.answerData[item.field_name] = this.props.variables[item.variableKey];
      }
    });

    const items = data_items.filter(x => !x.parentId && this._evaluateCondition(x)).map(item => {
      if (!item) return null;
      switch (item.element) {
        case 'TextInput':
        case 'SensitiveInput':
        case 'EmailInput':
        case 'PhoneNumber':
        case 'NumberInput':
        case 'TextArea':
        case 'Dropdown':
        case 'DatePicker':
        case 'RadioButtons':
        case 'Rating':
        case 'Tags':
        case 'Range':
          return this.getInputElement(item);
        case 'CustomElement':
          return this.getCustomElement(item);
        case 'MultiColumnRow':
          return this.getContainerElement(item, MultiColumnRow);
        case 'ThreeColumnRow':
          return this.getContainerElement(item, ThreeColumnRow);
        case 'TwoColumnRow':
          return this.getContainerElement(item, TwoColumnRow);
        case 'FieldSet':
        return this.getContainerElement(item, FieldSet);
        case 'Signature':
          return <Signature ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only || item.readOnly} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
        case 'Checkboxes':
          return <Checkboxes ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only} handleChange={this.handleChange} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._optionsDefaultValue(item)} />;
        case 'Image':
          return <Image ref={c => this.inputs[item.field_name] = c} handleChange={this.handleChange} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
        case 'Download':
          return <Download download_path={this.props.download_path} mutable={true} key={`form_${item.id}`} data={item} />;
        case 'Camera':
          return <Camera ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only || item.readOnly} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
          case 'FileUpload':
            return (
              <FileUpload
                ref={(c) => (this.inputs[item.field_name] = c)}
                read_only={this.props.read_only || item.readOnly}
                mutable={true}
                key={`form_${item.id}`}
                data={item}
                defaultValue={this._getDefaultValue(item)}
              />
            );
        default:
          return this.getSimpleElement(item);
      }
    });

    const formTokenStyle = {
      display: 'none',
    };
    return (
      <div>
          <FormValidator emitter={this.emitter} />
          <div className='react-form-builder-form'>
            <form encType='multipart/form-data' ref={c => this.form = c} action={this.props.form_action} onBlur={this.handleBlur} onChange={this.handleChange} onSubmit={this.handleSubmit} method={this.props.form_method}>
              {this.props.authenticity_token &&
                <div style={formTokenStyle}>
                  <input name='utf8' type='hidden' value='&#x2713;' />
                  <input name='authenticity_token' type='hidden' value={this.props.authenticity_token} />
                  <input name='task_id' type='hidden' value={this.props.task_id} />
                </div>
              }
              {items}
              <div className='btn-toolbar'>
                {!this.props.hide_actions &&
                  this.handleRenderSubmit()
                }
                {!this.props.hide_actions && this.props.back_action &&
                  this.handleRenderBack()
                }
              </div>
            </form>
          </div>
      </div>
    );
  }
}

export default injectIntl(ReactForm);
ReactForm.defaultProps = { validateForCorrectness: false };
