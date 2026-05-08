/* eslint-disable quote-props */
// eslint-disable-next-line max-classes-per-file
import fetch from 'isomorphic-fetch';
import { saveAs } from 'file-saver';
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import SignaturePad from 'react-signature-canvas';
import ReactBootstrapSlider from '@goldenpine/react-bootstrap-slider';

import StarRating from './star-rating';
import DatePicker from './date-picker';
import ComponentHeader from './component-header';
import ComponentLabel from './component-label';
import myxss from './myxss';

// This component is used for text inputs (text, email, tel, number) and textarea 
// to provide a floating placeholder that moves above the input 
// when the user focuses on the input or when there is a value in the input. 
// It accepts the following props:
// - Tag: the HTML tag to use for the input (default is 'input', can be 'textarea' for multiline input)
const FloatingPlaceholderInput = ({ Tag = 'input', inputProps = {}, placeholder = '', defaultValue = '', mutable = false }) => {
  const [hasValue, setHasValue] = useState(!!(defaultValue && String(defaultValue).length > 0));
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setHasValue(!!(defaultValue && String(defaultValue).length > 0));
  }, [defaultValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setHasValue(val !== '' && val !== undefined && val !== null);
    if (typeof inputProps.onChange === 'function') {
      inputProps.onChange(e);
    }
  };

  const handleFocus = (e) => {
    setFocused(true);
    if (typeof inputProps.onFocus === 'function') {
      inputProps.onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);
    // If no value, ensure placeholder returns to original position
    if (!ref.current || !ref.current.value) {
      setHasValue(false);
    }
    if (typeof inputProps.onBlur === 'function') {
      inputProps.onBlur(e);
    }
  };

  // remove placeholder attribute from actual input to avoid duplicate text
  const { placeholder: _ph, ...restProps } = inputProps;

  const shrunken = hasValue || focused;

  return (
    <div className={`floating-input-wrapper${placeholder ? ' has-placeholder' : ''}`} onClick={() => { if (ref.current) ref.current.focus(); }}>
      <Tag
        {...restProps}
        ref={ref}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        defaultValue={mutable ? defaultValue : undefined}
      />
      {placeholder && (
        <span className={`fb-placeholder ${shrunken ? 'shrunken' : ''}`}>{placeholder}</span>
      )}
    </div>
  );
};

const FormElements = {};

// Helper function to format placeholder with asterisk if the field is required and label is hidden. 
// The function checks if the field has a required label, if the label is hidden, and if the placeholder is not empty. 
// If all conditions are met, it appends an asterisk to the placeholder.
function formatPlaceholder(placeholder, hasRequiredLabel, labelHidden) {
  let result = placeholder || '';

  if (
    hasRequiredLabel &&
    labelHidden &&
    result.trim() !== '' &&
    !result.endsWith('*')
  ) {
    result += ' *';
  }

  return result;
}

class Header extends React.Component {
  render() {
    // const headerClasses = `dynamic-input ${this.props.data.element}-input`;
    let classNames = 'static';
    if (this.props.data.bold) {
      classNames += ' bold';
    }
    if (this.props.data.italic) {
      classNames += ' italic';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <h3
          className={classNames}
          dangerouslySetInnerHTML={{
            __html: myxss.process(this.props.data.content),
          }}
        />
      </div>
    );
  }
}

class Paragraph extends React.Component {
  render() {
    let classNames = 'static';
    if (this.props.data.bold) {
      classNames += ' bold';
    }
    if (this.props.data.italic) {
      classNames += ' italic';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div
          className={classNames}
          dangerouslySetInnerHTML={{
            __html: myxss.process(this.props.data.content),
          }}
        />
      </div>
    );
  }
}

class Label extends React.Component {
  render() {
    let classNames = 'static';
    if (this.props.data.bold) {
      classNames += ' bold';
    }
    if (this.props.data.italic) {
      classNames += ' italic';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <label
          className={`${classNames} form-label`}
          dangerouslySetInnerHTML={{
            __html: myxss.process(this.props.data.content),
          }}
        />
      </div>
    );
  }
}

class LineBreak extends React.Component {
  render() {
    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <hr />
      </div>
    );
  }
}

class TextInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.type = 'text';
    props.className = 'form-control';
    props.name = this.props.data.field_name;
    
    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
              this.props.data.hasOwnProperty('required') &&
              this.props.data.required === true &&
              !this.props.read_only;
    props.placeholder = formatPlaceholder(
      this.props.data.placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", // In app, it's leveraged to identify element labels. Additionally removed !important of its specificity in scss to make it work with labelHidden.
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <FloatingPlaceholderInput inputProps={props} placeholder={props.placeholder} defaultValue={props.defaultValue} mutable={this.props.mutable} />
        </div>
      </div>
    );
  }
}

class SensitiveInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
    this.state = {
      value: props.defaultValue !== undefined ? props.defaultValue : '',
      focused: false,
      show: false,
    };
  }

  handleChange = (e) => {
    const val = e.target.value;
    this.setState({ value: val });
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleBlur = () => {
    this.setState({ focused: false });
  };

  toggleShow = (e) => {
    if (e) e.stopPropagation();
    const next = !this.state.show;
    this.setState({ show: next }, () => {
      if (this.inputField && this.inputField.current) {
        try {
          this.inputField.current.type = next ? 'text' : 'password';
        } catch (err) {
          // ignore if cannot change type
        }
      }
    });
  };

  render() {
    const props = {};
    props.type = 'password';
    props.className = 'form-control';
    props.name = this.props.data.field_name;

    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
      this.props.data.hasOwnProperty('required') &&
      this.props.data.required === true &&
      !this.props.read_only;
    props.placeholder = formatPlaceholder(
      this.props.data.placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

     // remove placeholder attribute from actual input to avoid duplicate text
    const { placeholder: _ph, ...restProps } = props;
    const shrunken = (this.state.value && String(this.state.value).length > 0) || this.state.focused;

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label",
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <div className={`floating-input-wrapper${props.placeholder ? ' has-placeholder' : ''} sensitive-wrapper`} onClick={() => { if (this.inputField.current) this.inputField.current.focus(); }}>
            <input
              {...restProps}
              ref={this.inputField}
              onChange={this.handleChange}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
            />
            {props.placeholder && (
              <span className={`fb-placeholder ${shrunken ? 'shrunken' : ''}`}>{props.placeholder}</span>
            )}
            <i
              className={`fas ${this.state.show ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
              onClick={this.toggleShow}
              // title={this.state.show ? 'Hide' : 'Show'}
            />
          </div>
        </div>
      </div>
    );
  }
}

class EmailInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.type = 'text';
    props.className = 'form-control';
    props.name = this.props.data.field_name;

    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
              this.props.data.hasOwnProperty('required') &&
              this.props.data.required === true &&
              !this.props.read_only;
    props.placeholder = formatPlaceholder(
      this.props.data.placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <FloatingPlaceholderInput inputProps={props} placeholder={props.placeholder} defaultValue={props.defaultValue} mutable={this.props.mutable} />
        </div>
      </div>
    );
  }
}

class PhoneNumber extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.type = 'tel';
    props.className = 'form-control';
    props.name = this.props.data.field_name;

    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
              this.props.data.hasOwnProperty('required') &&
              this.props.data.required === true &&
              !this.props.read_only;
    let placeholder; // For phone number input, if placeholder is not set, we will set a default placeholder with an asterisk if it's required, to give users a hint about the expected format and the requirement. The default placeholder is "+12345678900" which is in E.164 format without spaces or dashes, as it's the most widely accepted format for international phone numbers and works well with the pattern validation we have in place. Merchants can customize this placeholder or even disable it by leaving it blank in the form builder.
    if (this.props.data.placeholder !== undefined && this.props.data.placeholder !== null) {
      placeholder = this.props.data.placeholder;
    } else {
      placeholder = '+12345678900';
    }
    props.placeholder = formatPlaceholder(
      placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <FloatingPlaceholderInput inputProps={props} placeholder={props.placeholder} defaultValue={props.defaultValue} mutable={this.props.mutable} />
        </div>
      </div>
    );
  }
}

class NumberInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.type = 'number';
    props.className = 'form-control';
    props.name = this.props.data.field_name;

    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
              this.props.data.hasOwnProperty('required') &&
              this.props.data.required === true &&
              !this.props.read_only;
    props.placeholder = formatPlaceholder(
      this.props.data.placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <FloatingPlaceholderInput inputProps={props} placeholder={props.placeholder} defaultValue={props.defaultValue} mutable={this.props.mutable} />
        </div>
      </div>
    );
  }
}

class TextArea extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.className = 'form-control';
    props.name = this.props.data.field_name;

    const labelHidden = this.props.data.labelHidden || false;
    const hasRequiredLabel =
              this.props.data.hasOwnProperty('required') &&
              this.props.data.required === true &&
              !this.props.read_only;
    props.placeholder = formatPlaceholder(
      this.props.data.placeholder,
      hasRequiredLabel,
      labelHidden
    );

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <FloatingPlaceholderInput Tag="textarea" inputProps={props} placeholder={props.placeholder} defaultValue={props.defaultValue} mutable={this.props.mutable} />
        </div>
      </div>
    );
  }
}

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.className = 'form-control';
    props.name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;

    if (this.props.mutable) {
      props.defaultValue = this.props.defaultValue;
      props.ref = this.inputField;
    }

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <select {...props}>
            {this.props.data.options.map((option) => {
              const this_key = `preview_${option.key}`;
              return (
                <option value={option.value} key={this_key}>
                  {option.text}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }
}

class Signature extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultValue: props.defaultValue,
    };
    this.inputField = React.createRef();
    this.canvas = React.createRef();
  }

  clear = () => {
    if (this.state.defaultValue) {
      this.setState({ defaultValue: '' });
    } else if (this.canvas.current) {
      this.canvas.current.clear();
    }
  };

  render() {
    const { defaultValue } = this.state;
    let canClear = !!defaultValue;
    const props = {};
    props.type = 'hidden';
    props.name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;

    if (this.props.mutable) {
      props.defaultValue = defaultValue;
      props.ref = this.inputField;
    }
    const pad_props = {};
    // umd requires canvasProps={{ width: 400, height: 150 }}
    if (this.props.mutable) {
      pad_props.defaultValue = defaultValue;
      pad_props.ref = this.canvas;
      canClear = !this.props.read_only;
    }
    pad_props.clearOnResize = false;

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    let sourceDataURL;
    if (defaultValue && defaultValue.length > 0) {
      sourceDataURL = `data:image/png;base64,${defaultValue}`;
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.read_only === true || !!sourceDataURL ? (
            <img src={sourceDataURL} />
          ) : (
            <SignaturePad {...pad_props} />
          )}
          {canClear && (
            <i
              className="fas fa-times clear-signature"
              onClick={this.clear}
              title="Clear Signature"
            ></i>
          )}
          <input {...props} />
        </div>
      </div>
    );
  }
}

class Tags extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
    const { defaultValue, data } = props;
    this.state = { value: this.getDefaultValue(defaultValue, data.options) };
  }

  getDefaultValue(defaultValue, options) {
    if (defaultValue) {
      if (typeof defaultValue === 'string') {
        const vals = defaultValue.split(',').map((x) => x.trim());
        return options.filter((x) => vals.indexOf(x.value) > -1);
      }
      return options.filter((x) => defaultValue.indexOf(x.value) > -1);
    }
    return [];
  }

  // state = { value: this.props.defaultValue !== undefined ? this.props.defaultValue.split(',') : [] };

  handleChange = (e) => {
    this.setState({ value: e || [] });
  };

  render() {
    const options = this.props.data.options.map((option) => {
      option.label = option.text;
      return option;
    });
    const props = {};
    props.isMulti = true;
    props.name = this.props.data.field_name;
    props.onChange = this.handleChange;
    const labelHidden = this.props.data.labelHidden || false;

    props.options = options;
    if (!this.props.mutable) {
      props.value = options[0].text;
    } // to show a sample of what tags looks like
    if (this.props.mutable) {
      props.isDisabled = this.props.read_only;
      props.value = this.state.value;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <Select {...props} />
        </div>
      </div>
    );
  }
}

class Checkboxes extends React.Component {
  constructor(props) {
    super(props);
    this.options = {};
  }

  render() {
    const self = this;
    const labelHidden = this.props.data.labelHidden || false;

    let classNames = 'form-check';
    if (this.props.data.inline) {
      classNames += ' form-check-inline';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.data.options.map((option) => {
            const this_key = `preview_${option.key}`;
            const props = {};
            props.name = `option_${option.key}`;

            props.type = 'checkbox';
            props.value = option.value;
            if (self.props.mutable) {
              props.defaultChecked =
                self.props.defaultValue !== undefined &&
                (self.props.defaultValue.indexOf(option.key) > -1 ||
                  self.props.defaultValue.indexOf(option.value) > -1);
            }
            if (this.props.read_only) {
              props.disabled = 'disabled';
            }
            return (
              <div className={classNames} key={this_key}>
                <input
                  id={`fid_${this_key}`}
                  className="form-check-input"
                  ref={(c) => {
                    if (c && self.props.mutable) {
                      self.options[`child_ref_${option.key}`] = c;
                    }
                  }}
                  data-required-checks={this.props.data.checkbox_required_checks ? this.props.data.checkbox_required_checks : '1'}
                  {...props}
                />
                <label
                  className="form-check-label"
                  htmlFor={`fid_${this_key}`}
                >
                  {option.text}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

class RadioButtons extends React.Component {
  constructor(props) {
    super(props);
    this.options = {};
  }

  render() {
    const self = this;
    const labelHidden = this.props.data.labelHidden || false;

    let classNames = 'form-check';
    if (this.props.data.inline) {
      classNames += ' form-check-inline';
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.data.options.map((option) => {
            const this_key = `preview_${option.key}`;
            const props = {};
            props.name = self.props.data.field_name;

            props.type = 'radio';
            props.value = option.value;
            if (self.props.mutable) {
              props.defaultChecked =
                self.props.defaultValue !== undefined &&
                (self.props.defaultValue.indexOf(option.key) > -1 ||
                  self.props.defaultValue.indexOf(option.value) > -1);
            }
            if (this.props.read_only) {
              props.disabled = 'disabled';
            }

            return (
              <div className={classNames} key={this_key}>
                <input
                  id={`fid_${this_key}`}
                  className="form-check-input"
                  ref={(c) => {
                    if (c && self.props.mutable) {
                      self.options[`child_ref_${option.key}`] = c;
                    }
                  }}
                  {...props}
                />
                <label
                  className="form-check-label"
                  htmlFor={`fid_${this_key}`}
                >
                  {option.text}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

class Image extends React.Component {
  render() {
    const style = this.props.data.center ? { textAlign: 'center' } : null;

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style, ...style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        {this.props.data.src && (
          <img
            src={this.props.data.src}            
            style={{ height: this.props.data.height, width: this.props.data.width, display: 'inline' }}
          />
        )}
        {!this.props.data.src && <div className="no-image">No Image</div>}
      </div>
    );
  }
}

class Rating extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  render() {
    const props = {};
    props.name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;

    props.ratingAmount = 5;

    if (this.props.mutable) {
      props.rating =
        this.props.defaultValue !== undefined
          ? parseFloat(this.props.defaultValue, 10)
          : 0;
      props.editing = true;
      props.disabled = this.props.read_only;
      props.ref = this.inputField;
    }

    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <StarRating {...props} />
        </div>
      </div>
    );
  }
}

class HyperLink extends React.Component {
  render() {
    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <label className={'form-label'}>
            <a
              target="_blank"
              href={this.props.data.href}
              dangerouslySetInnerHTML={{
                __html: myxss.process(this.props.data.content),
              }}
            />
          </label>
        </div>
      </div>
    );
  }
}

class Download extends React.Component {
  render() {
    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <a
            href={`${this.props.download_path}?id=${this.props.data.file_path}`}
          >
            {this.props.data.content}
          </a>
        </div>
      </div>
    );
  }
}

class Camera extends React.Component {
  constructor(props) {
    super(props);
    this.state = { img: null, previewImg: null };
  }

  displayImage = (e) => {
    const self = this;
    const target = e.target;
    if (target.files && target.files.length) {
      self.setState({
        img: target.files[0],
        previewImg: URL.createObjectURL(target.files[0]),
      });
    }
  };

  clearImage = () => {
    this.setState({
      img: null,
      previewImg: null,
    });
  };

  getImageSizeProps({ width, height }) {
    const imgProps = { width: '100%' };
    if (width) {
      imgProps.width =
        width < window.innerWidth ? width : 0.9 * window.innerWidth;
    }
    if (height) {
      imgProps.height = height;
    }
    return imgProps;
  }

  /* 
    Originally Image/File upload elments don't count the heights of all visible controls which is layered on top of <input>,
    which makes the element possibly overlaps on the next element on a narrow screen. 
    It's caused by "position: absolue" of .image-upload-control.
    The fix is to add inline style "position: relative" to the container div of .image-upload-control, and use <label> tag
    and "for"/"id" to trigger to the file input dialog.
  */
  render() {
    const imageStyle = {
      // 2025/11/11
      // 'scale-down' looks to keep the original size of image on form-builder-generator.
      // and sometimes the image is too small. Supposeing admin want to show the image in bigger size,
      // so adjust it "contain" to make it bigger if possible. 
      // "contain" is supposed to "Preserves the aspect ratio, and fits the image inside the container, without cutting"
      objectFit: 'contain', 
      objectPosition: this.props.data.center ? 'center' : 'left',
      // Move width and height from element style to inline style of image, to make it work the same way as 'Image' element.
      width: this.props.data.width,
      height: this.props.data.height,
    };
    let baseClasses = 'SortableItem rfb-item';
    const name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;

    const fileInputStyle = this.state.img ? { display: 'none' } : null;
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }
    let sourceDataURL;
    if (
      this.props.read_only === true &&
      this.props.defaultValue &&
      this.props.defaultValue.length > 0
    ) {
      if (this.props.defaultValue.indexOf(name > -1)) {
        sourceDataURL = this.props.defaultValue;
      } else {
        sourceDataURL = `data:image/png;base64,${this.props.defaultValue}`;
      }
    }

  if(this.props.data.upload_layout !== "dropzone") {
    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.read_only === true &&
          this.props.defaultValue &&
          this.props.defaultValue.length > 0 ? (
            <div>
              <img
                style={imageStyle}
                src={sourceDataURL}
                // {...this.getImageSizeProps(this.props.data)} // move width and height from element style to inline style of image, to make it work the same way as 'Image' element.
              />
            </div>
          ) : (
            <div className="image-upload-container">
              <div style={fileInputStyle}>
                <input
                  name={name}
                  type="file"
                  accept="image/*"
                  //capture="camera" // With this property, users on most mobiles can only take photo but no options to pick up a photo from gallery
                  className="image-upload visually-hidden"
                  onChange={this.displayImage}
                  data-clearlabel={this.props.data.label_after_photo_clear_icon}
                  disabled={this.props.read_only}
                  id={name}
                />
                <div className="image-upload-control" style={{ position: 'relative' }}>
                  <label className="btn btn-outline-secondary" htmlFor={name}>
                    <i className="fas fa-camera"></i> {this.props.data.label_after_camera_icon}
                  </label>
                  <div>{this.props.data.message_under_camera_icon}</div>
                </div>
              </div>

              {this.state.img && (
                <div>
                  <img
                    onLoad={() => URL.revokeObjectURL(this.state.previewImg)}
                    src={this.state.previewImg}
                    height="100"
                    className="image-upload-preview"
                  />
                  <button className="btn btn-image-clear" onClick={this.clearImage}>
                    <i className="fas fa-times"></i> {this.props.data.label_after_photo_clear_icon}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }else {
       return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.read_only === true &&
          this.props.defaultValue &&
          this.props.defaultValue.length > 0 ? (
            <div>
              <img
                style={imageStyle}
                src={sourceDataURL}
              />
            </div>
          ) : (          
            <div className="image-upload-container">
              {/* The modern "Card" style upload area */}
              <div style={fileInputStyle} className="upload-card">
                <input
                  name={name}
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={this.displayImage}
                  data-clearlabel={this.props.data.label_after_photo_clear_icon}
                  disabled={this.props.read_only}
                  id={name}
                />
                
                <label htmlFor={name} className="upload-card-content">
                  <i className="fas fa-cloud-upload-alt upload-icon"></i>
                  <span className="upload-text">{this.props.data.message_under_camera_icon}</span>
                  <div className="btn-browse">{this.props.data.label_after_camera_icon}</div>
                </label>
              </div>

              {/* Preview Section */}
              {this.state.img && (
                <div>
                  <img
                    onLoad={() => URL.revokeObjectURL(this.state.previewImg)}
                    src={this.state.previewImg}
                    className="image-upload-preview"
                    alt="Preview"
                    height="100"
                  />
                  <button className="btn btn-image-clear" onClick={this.clearImage}>
                    <i className="fas fa-times"></i> {this.props.data.label_after_photo_clear_icon}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  }
}

class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fileUpload: null };
  }

  displayFileUpload = (e) => {
    const self = this;
    const target = e.target;
    let file;

    if (target.files && target.files.length > 0) {
      file = target.files[0];

      self.setState({
        fileUpload: file,
      });
    }
  };

  clearFileUpload = () => {
    this.setState({
      fileUpload: null,
    });
  };

  saveFile = async (e) => {
    e.preventDefault();
    const sourceUrl = this.props.defaultValue;
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
      responseType: 'blob',
    });
    const dispositionHeader = response.headers.get('Content-Disposition');
    const resBlob = await response.blob();
    // eslint-disable-next-line no-undef
    const blob = new Blob([resBlob], {
      type: this.props.data.fileType || response.headers.get('Content-Type'),
    });
    if (dispositionHeader && dispositionHeader.indexOf(';filename=') > -1) {
      const fileName = dispositionHeader.split(';filename=')[1];
      saveAs(blob, fileName);
    } else {
      const fileName = sourceUrl.substring(sourceUrl.lastIndexOf('/') + 1);
      saveAs(response.url, fileName);
    }
  };

  render() {
    let baseClasses = 'SortableItem rfb-item';
    const name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;

    const fileInputStyle = this.state.fileUpload ? { display: 'none' } : null;
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }
    if (this.props.data.upload_layout !== 'dropzone') {
      return (
        <div style={{ ...this.props.style }} className={baseClasses}>
          <ComponentHeader {...this.props} />
          <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
            {this.props.read_only === true &&
            this.props.defaultValue &&
            this.props.defaultValue.length > 0 ? (
              <div>
                <button className="btn btn-outline-secondary" onClick={this.saveFile}>
                  <i className="fas fa-download"></i> Download File
                </button>
              </div>
            ) : (
              <div className="image-upload-container">
                <div style={fileInputStyle}>
                  <input
                    name={name}
                    type="file"
                    accept={this.props.data.fileType || '*'}
                    className="image-upload visually-hidden"
                    onChange={this.displayFileUpload}
                    data-clearlabel={this.props.data.label_after_file_clear_icon}
                    disabled={this.props.read_only}
                    id={name}
                  />
                  <div className="image-upload-control" style={{ position: 'relative' }}>
                    <label className="btn btn-outline-secondary" htmlFor={name}>
                      <i className="fas fa-file"></i> {this.props.data.label_after_file_icon}
                    </label>
                    <div>{this.props.data.message_under_file_icon}</div>
                  </div>
                </div>

                {this.state.fileUpload && (
                  <div>
                    <div className="file-upload-preview">
                      <div
                        style={{ display: 'inline-block', marginRight: '5px' }}
                      >
                        {this.state.fileUpload.name}
                      </div>
                      <div style={{ display: 'inline-block', marginLeft: '5px' }}>
                        {this.state.fileUpload.size.length > 6
                          ? `  ${Math.ceil(
                              this.state.fileUpload.size / (1024 * 1024)
                            )} mb`
                          : `  ${Math.ceil(
                              this.state.fileUpload.size / 1024
                            )} kb`}
                      </div>
                    </div>
                    <br />
                    <div
                      className="btn btn-file-upload-clear"
                      onClick={this.clearFileUpload}
                    >
                      <i className="fas fa-times"></i> {this.props.data.label_after_file_clear_icon}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // non-standard layout: use "upload-card" style like Camera
    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          {this.props.read_only === true &&
          this.props.defaultValue &&
          this.props.defaultValue.length > 0 ? (
            <div>
              <button className="btn btn-outline-secondary" onClick={this.saveFile}>
                <i className="fas fa-download"></i> Download File
              </button>
            </div>
          ) : (
            <div className="image-upload-container">
              <div style={fileInputStyle} className="upload-card">
                <input
                  name={name}
                  type="file"
                  accept={this.props.data.fileType || '*'}
                  className="visually-hidden"
                  onChange={this.displayFileUpload}
                  data-clearlabel={this.props.data.label_after_file_clear_icon}
                  disabled={this.props.read_only}
                  id={name}
                />

                <label htmlFor={name} className="upload-card-content">
                  <i className="fas fa-file-upload upload-icon"></i>
                  <span className="upload-text">{this.props.data.message_under_file_icon}</span>
                  <div className="btn-browse">{this.props.data.label_after_file_icon}</div>
                </label>
              </div>

              {this.state.fileUpload && (
                <div>
                  <div className="file-upload-preview">
                    <div style={{ display: 'inline-block', marginRight: '5px' }}>
                      {this.state.fileUpload.name}
                    </div>
                    <div style={{ display: 'inline-block', marginLeft: '5px' }}>
                      {this.state.fileUpload.size.length > 6
                        ? `  ${Math.ceil(
                            this.state.fileUpload.size / (1024 * 1024)
                          )} mb`
                        : `  ${Math.ceil(
                            this.state.fileUpload.size / 1024
                          )} kb`}
                    </div>
                  </div>
                  <br />
                  <div className="btn btn-file-upload-clear" onClick={this.clearFileUpload}>
                    <i className="fas fa-times"></i> {this.props.data.label_after_file_clear_icon}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

class Range extends React.Component {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
    this.state = {
      value:
        props.defaultValue !== undefined
          ? parseInt(props.defaultValue, 10)
          : parseInt(props.data.default_value, 10),
    };
  }

  changeValue = (e) => {
    const { target } = e;
    this.setState({
      value: target.value,
    });
  };

  render() {
    const props = {};
    const name = this.props.data.field_name;
    const labelHidden = this.props.data.labelHidden || false;    

    props.type = 'range';
    props.list = `tickmarks_${name}`;
    props.min = Number(this.props.data.min_value);
    props.max = Number(this.props.data.max_value);
    props.step = Number(this.props.data.step) || 1;

    props.value = this.state.value;
    props.change = this.changeValue;

    if (this.props.mutable) {
      props.ref = this.inputField;
    }

    const datalist = [];
    for (
      let i = parseInt(props.min, 10);
      i <= parseInt(props.max, 10);
      i += parseInt(props.step, 10)
    ) {
      datalist.push(i);
    }

    const oneBig = 100 / (datalist.length - 1);

    const _datalist = datalist.map((d, idx) => (
      <option key={`${props.list}_${idx}`}>{d}</option>
    ));

    const visible_marks = datalist.map((d, idx) => {
      const option_props = {};
      let w = oneBig;
      if (idx === 0 || idx === datalist.length - 1) {
        w = oneBig / 2;
      }
      option_props.key = `${props.list}_label_${idx}`;
      option_props.style = { width: `${w}%` };
      if (idx === datalist.length - 1) {
        option_props.style = { width: `${w}%`, textAlign: 'right' };
      }
      return <label {...option_props}>{d}</label>;
    });

    if (this.props.read_only) {
      props.disabled = 'disabled';
    }
    let baseClasses = 'SortableItem rfb-item';
    if (this.props.data.pageBreakBefore) {
      baseClasses += ' alwaysbreak';
    }

    return (
      <div style={{ ...this.props.style }} className={baseClasses}>
        <ComponentHeader {...this.props} />
        <div className="mb-3">
          <ComponentLabel
            {...this.props}
            className={[
              "form-label", 
              this.props.className,
              labelHidden ? "d-none" : ""
            ].filter(Boolean).join(" ")}
          />
          <div className="range">
            <div className="clearfix">
              <span className="float-start">{this.props.data.min_label}</span>
              <span className="float-end">{this.props.data.max_label}</span>
            </div>
            <ReactBootstrapSlider {...props} />
          </div>
          <div className="visible_marks">{visible_marks}</div>
          <input name={name} value={this.state.value} type="hidden" 
                data-min-value={props.min}
                data-max-value={props.max}
                data-step={props.step} />
          <datalist id={props.list}>{_datalist}</datalist>
        </div>
      </div>
    );
  }
}

FormElements.Header = Header;
FormElements.Paragraph = Paragraph;
FormElements.Label = Label;
FormElements.LineBreak = LineBreak;
FormElements.TextInput = TextInput;
FormElements.SensitiveInput = SensitiveInput;
FormElements.EmailInput = EmailInput;
FormElements.PhoneNumber = PhoneNumber;
FormElements.NumberInput = NumberInput;
FormElements.TextArea = TextArea;
FormElements.Dropdown = Dropdown;
FormElements.Signature = Signature;
FormElements.Checkboxes = Checkboxes;
FormElements.DatePicker = DatePicker;
FormElements.RadioButtons = RadioButtons;
FormElements.Image = Image;
FormElements.Rating = Rating;
FormElements.Tags = Tags;
FormElements.HyperLink = HyperLink;
FormElements.Download = Download;
FormElements.Camera = Camera;
FormElements.FileUpload = FileUpload;
FormElements.Range = Range;

export default FormElements;
