import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import {
  ContentState, EditorState, convertFromHTML, convertToRaw,
} from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';

import DynamicOptionList from './dynamic-option-list';
import { get } from './stores/requests';
import ID from './UUID';
import IntlMessages from './language-provider/IntlMessages';

const toolbar = {
  options: ['inline', 'list', 'textAlign', 'fontSize', 'link', 'history'],
  inline: {
    inDropdown: false,
    className: undefined,
    options: ['bold', 'italic', 'underline', 'superscript', 'subscript'],
  },
};

export default class FormElementsEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      element: this.props.element,
      data: this.props.data,
      dirty: false,
    };
  }

  toggleRequired() {
    // const this_element = this.state.element;
  }

  editElementProp(elemProperty, targProperty, e) {
    // elemProperty could be content or label
    // targProperty could be value or checked
    const this_element = this.state.element;
    this_element[elemProperty] = e.target[targProperty];

    this.setState({
      element: this_element,
      dirty: true,
    }, () => {
      if (targProperty === 'checked') { this.updateElement(); }
    });
  }

  // Instead of using editElementProp for the camera layout change, we have a separate handler to immediately update the element on change without waiting for blur, as it's a radio button and we want the change to be reflected immediately in the UI.
  handleUploadLayoutChange = (e) => {
    const this_element = this.state.element;
    this_element["upload_layout"] = e.target["value"];

    this.setState({
      element: this_element,
      dirty: true,
    }, () => {
       this.updateElement(); 
    });
  };

  onEditorStateChange(index, property, editorContent) {
     const html = draftToHtml(convertToRaw(editorContent.getCurrentContent())).replace(/<p>/g, '<div>').replace(/<\/p>/g, '</div>');
    //const html = draftToHtml(convertToRaw(editorContent.getCurrentContent())).replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/&nbsp;/g, ' ')
    //  .replace(/(?:\r\n|\r|\n)/g, ' ');
    const this_element = this.state.element;
    this_element[property] = html;

    this.setState({
      element: this_element,
      dirty: true,
    });
  }

  updateElement() {
    const this_element = this.state.element;
    // to prevent ajax calls with no change
    if (this.state.dirty) {
      this.props.updateElement.call(this.props.preview, this_element);
      this.setState({ dirty: false });
    }
  }

  convertFromHTML(content) {
    const newContent = convertFromHTML(content);
    if (!newContent.contentBlocks || !newContent.contentBlocks.length) {
      // to prevent crash when no contents in editor
      return EditorState.createEmpty();
    }
    const contentState = ContentState.createFromBlockArray(newContent);
    return EditorState.createWithContent(contentState);
  }

  addOptions() {
    const optionsApiUrl = document.getElementById('optionsApiUrl').value;
    if (optionsApiUrl) {
      get(optionsApiUrl).then(data => {
        this.props.element.options = [];
        const { options } = this.props.element;
        data.forEach(x => {
          // eslint-disable-next-line no-param-reassign
          x.key = ID.uuid();
          options.push(x);
        });
        const this_element = this.state.element;
        this.setState({
          element: this_element,
          dirty: true,
        });
      });
    }
  }

  validateImageSize(e) {
    const regex = /^$|^\d+(px|%)$/;
    if (regex.test(e.target.value)) {
      e.target.classList.remove("is-invalid");
      e.target.classList.add("is-valid");
    } else {
      e.target.classList.remove("is-valid");
      e.target.classList.add("is-invalid");
    }
  }
    
  render() {
    if (this.state.dirty) {
      this.props.element.dirty = true;
    }

    const this_checked = this.props.element.hasOwnProperty('required') ? this.props.element.required : false;
    const this_read_only = this.props.element.hasOwnProperty('readOnly') ? this.props.element.readOnly : false;
    const this_default_today = this.props.element.hasOwnProperty('defaultToday') ? this.props.element.defaultToday : false;
    const this_show_time_select = this.props.element.hasOwnProperty('showTimeSelect') ? this.props.element.showTimeSelect : false;
    const this_show_time_select_only = this.props.element.hasOwnProperty('showTimeSelectOnly') ? this.props.element.showTimeSelectOnly : false;
    const this_show_time_input = this.props.element.hasOwnProperty('showTimeInput') ? this.props.element.showTimeInput : false;
    const this_checked_inline = this.props.element.hasOwnProperty('inline') ? this.props.element.inline : false;
    const this_checked_bold = this.props.element.hasOwnProperty('bold') ? this.props.element.bold : false;
    const this_checked_italic = this.props.element.hasOwnProperty('italic') ? this.props.element.italic : false;
    const this_checked_center = this.props.element.hasOwnProperty('center') ? this.props.element.center : false;
    const this_checked_page_break = this.props.element.hasOwnProperty('pageBreakBefore') ? this.props.element.pageBreakBefore : false;
    const this_checked_alternate_form = this.props.element.hasOwnProperty('alternateForm') ? this.props.element.alternateForm : false;

    const {
      canHavePageBreakBefore, canHaveAlternateForm, canHaveDisplayHorizontal, canHaveOptionCorrect, canHaveOptionValue,
    } = this.props.element;
    const canHaveImageSize = (this.state.element.element === 'Image' || this.state.element.element === 'Camera');
    const canHaveUploadLayout = ( this.state.element.element === 'Camera' || this.state.element.element === 'FileUpload' );
    const canHavePlaceholder = this.props.element.element === 'TextInput' || this.props.element.element === 'TextArea'
                              || this.props.element.element === 'EmailInput' || this.props.element.element === 'NumberInput'
                              || this.props.element.element === 'PhoneNumber';

    const this_files = this.props.files.length ? this.props.files : [];
    if (this_files.length < 1 || (this_files.length > 0 && this_files[0].id !== '')) {
      this_files.unshift({ id: '', file_name: '' });
    }

    let editorState;
    if (this.props.element.hasOwnProperty('content')) {
      editorState = this.convertFromHTML(this.props.element.content);
    }
    if (this.props.element.hasOwnProperty('label')) {
      editorState = this.convertFromHTML(this.props.element.label);
    }

    return (
      <div>
        <div className="clearfix">
          <h4 className="float-start">{this.props.element.text}</h4>
          <i className="float-end fas fa-times dismiss-edit" onClick={this.props.manualEditModeOff}></i>
        </div>
        { this.props.element.hasOwnProperty('content') &&
          <div className="mb-3">
            <label className="control-label"><IntlMessages id="text-to-display" />:</label>

            <Editor
              toolbar={toolbar}
              defaultEditorState={editorState}
              onBlur={this.updateElement.bind(this)}
              onEditorStateChange={this.onEditorStateChange.bind(this, 0, 'content')}
              stripPastedStyles={true} />
          </div>
        }
        { this.props.element.hasOwnProperty('file_path') &&
          <div className="mb-3">
            <label className="control-label" htmlFor="fileSelect"><IntlMessages id="choose-file" />:</label>
            <select id="fileSelect" className="form-control" defaultValue={this.props.element.file_path} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'file_path', 'value')}>
              {this_files.map((file) => {
                const this_key = `file_${file.id}`;
                return <option value={file.id} key={this_key}>{file.file_name}</option>;
              })}
            </select>
          </div>
        }
        { this.props.element.hasOwnProperty('href') &&
          <div className="mb-3">
            <TextAreaAutosize type="text" className="form-control" defaultValue={this.props.element.href} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'href', 'value')} />
          </div>
        }
        { this.props.element.hasOwnProperty('label') &&
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="mb-0">
                <IntlMessages id="display-label" />
              </label>

              <div className="form-check m-0">
                <input
                  id="label-hidden"
                  className="form-check-input"
                  type="checkbox"
                  checked={this.props.element.labelHidden || false}
                  onChange={this.editElementProp.bind(this, 'labelHidden', 'checked')}
                />
                <label className="form-check-label" htmlFor="label-hidden">
                  <IntlMessages id="label-hidden" />
                </label>
              </div>
            </div>
            <Editor
              toolbar={toolbar}
              defaultEditorState={editorState}
              onBlur={this.updateElement.bind(this)}
              onEditorStateChange={this.onEditorStateChange.bind(this, 0, 'label')}
              stripPastedStyles={true} />
            <br />
            <div className="form-check">
              <input id="is-required" className="form-check-input" type="checkbox" checked={this_checked} value={true} onChange={this.editElementProp.bind(this, 'required', 'checked')} />
              <label className="form-check-label" htmlFor="is-required">
              <IntlMessages id="required" />
              </label>
            </div>
            { this_checked && this.state.element.element === 'Checkboxes' &&
                <div className="d-flex align-items-center gap-2">
                  <label
                    className="form-label mb-0"
                    htmlFor="checkbox-required-checks"
                  >
                    <IntlMessages id="minimum-number-of-selections" />:
                  </label>
                  <input
                    id="checkbox-required-checks"
                    type="number"
                    min="1"
                    className="form-control d-inline-block"
                    style={{ width: '8ch' }}
                    value={this.props.element.checkbox_required_checks ?? '1'}
                    onBlur={this.updateElement.bind(this)}
                    onChange={this.editElementProp.bind(
                      this,
                      'checkbox_required_checks',
                      'value'
                    )}
                  />
                </div>
            }
            { this.props.element.hasOwnProperty('readOnly') &&
              <div className="form-check">
                <input id="is-read-only" className="form-check-input" type="checkbox" checked={this_read_only} value={true} onChange={this.editElementProp.bind(this, 'readOnly', 'checked')} />
                <label className="form-check-label" htmlFor="is-read-only">
                <IntlMessages id="read-only" />
                </label>
              </div>
            }
            { this.props.element.hasOwnProperty('defaultToday') &&
              <div className="form-check">
                <input id="is-default-to-today" className="form-check-input" type="checkbox" checked={this_default_today} value={true} onChange={this.editElementProp.bind(this, 'defaultToday', 'checked')} />
                <label className="form-check-label" htmlFor="is-default-to-today">
                <IntlMessages id="default-to-today" />?
                </label>
              </div>
            }
            { this.props.element.hasOwnProperty('showTimeSelect') &&
              <div className="form-check">
                <input id="show-time-select" className="form-check-input" type="checkbox" checked={this_show_time_select} value={true} onChange={this.editElementProp.bind(this, 'showTimeSelect', 'checked')} />
                <label className="form-check-label" htmlFor="show-time-select">
                <IntlMessages id="show-time-select" />?
                </label>
              </div>
            }
            { this_show_time_select && this.props.element.hasOwnProperty('showTimeSelectOnly') &&
              <div className="form-check">
                <input id="show-time-select-only" className="form-check-input" type="checkbox" checked={this_show_time_select_only} value={true} onChange={this.editElementProp.bind(this, 'showTimeSelectOnly', 'checked')} />
                <label className="form-check-label" htmlFor="show-time-select-only">
                <IntlMessages id="show-time-select-only" />?
                </label>
              </div>
            }
            { this.props.element.hasOwnProperty('showTimeInput') &&
              <div className="form-check">
                <input id="show-time-input" className="form-check-input" type="checkbox" checked={this_show_time_input} value={true} onChange={this.editElementProp.bind(this, 'showTimeInput', 'checked')} />
                <label className="form-check-label" htmlFor="show-time-input">
                <IntlMessages id="show-time-input" />?
                </label>
              </div>
            }
            { (this.state.element.element === 'RadioButtons' || this.state.element.element === 'Checkboxes') && canHaveDisplayHorizontal &&
              <div className="form-check">
                <input id="display-horizontal" className="form-check-input" type="checkbox" checked={this_checked_inline} value={true} onChange={this.editElementProp.bind(this, 'inline', 'checked')} />
                <label className="form-check-label" htmlFor="display-horizontal">
                <IntlMessages id="display-horizontal" />
                </label>
              </div>
            }
          </div>
        }
        { canHavePlaceholder &&
          <div className="mb-3">
            <label className="control-label" htmlFor="placeholderInput"><IntlMessages id="placeholder" /></label>
            <input id="placeholderInput" type="text" className="form-control" defaultValue={this.props.element.placeholder} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'placeholder', 'value')} />
          </div>
        }
        { this.props.element.hasOwnProperty('src') &&
          <div>
            <div className="mb-3">
              <label className="control-label" htmlFor="srcInput"><IntlMessages id="link-to" />:</label>
              <input id="srcInput" type="text" className="form-control" defaultValue={this.props.element.src} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'src', 'value')} />
            </div>
          </div>
        }
        { canHaveUploadLayout && (
            <div>
              {/* Upload Layout Selection */}
              <div className="mb-3">
                <label className="control-label bold">
                  <IntlMessages id="upload-layout" />:
                </label>

                <div className="d-flex align-items-center gap-3">
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="uploadLayout"
                      id="uploadLayoutStandard"
                      value="standard"
                      checked={this.props.element.upload_layout === "standard"}
                      onChange={this.handleUploadLayoutChange}
                    />
                    <label className="form-check-label ms-2" htmlFor="uploadLayoutStandard">
                      <IntlMessages id="upload-layout-standard" />
                    </label>
                  </div>

                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="uploadLayout"
                      id="uploadLayoutDropZone"
                      value="dropzone"
                      checked={this.props.element.upload_layout === "dropzone"}
                      onChange={this.handleUploadLayoutChange}
                    />
                    <label className="form-check-label ms-2" htmlFor="uploadLayoutDropZone">
                      <IntlMessages id="upload-layout-dropzone" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        {this.state.element.element === 'Camera' && (
          <div>
            <div className="mb-3">
              <label className="control-label" htmlFor="LabelAfterCameraIcon"><IntlMessages id="display-label-after-camera-icon" />:</label>
              <input id="LabelAfterCameraIcon" type="text" className="form-control" defaultValue={this.props.element.label_after_camera_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'label_after_camera_icon', 'value')} />
            </div>
            <div className="mb-3">
              <label className="control-label" htmlFor="MessageUnderCameraIcon"><IntlMessages id="display-message-under-camera-icon" />:</label>
              <input id="MessageUnderCameraIcon" type="text" className="form-control" defaultValue={this.props.element.message_under_camera_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'message_under_camera_icon', 'value')} />
            </div>
            <div className="mb-3">
              <label className="control-label" htmlFor="LabelAfterPhotoClearIcon"><IntlMessages id="display-label-after-photo-clear-icon" />:</label>
              <input id="LabelAfterPhotoClearIcon" type="text" className="form-control" defaultValue={this.props.element.label_after_photo_clear_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'label_after_photo_clear_icon', 'value')} />
            </div>
          </div>
        )}
        { canHaveImageSize &&
          <div>
            <div className="mb-3">
              <label className="control-label bold">
                <IntlMessages id="image-layout" />:
              </label>
              <div className="form-check">
                <input id="do-center" className="form-check-input" type="checkbox" checked={this_checked_center} value={true} onChange={this.editElementProp.bind(this, 'center', 'checked')} />
                <label className="form-check-label" htmlFor="do-center">
                <IntlMessages id="center" />?
                </label>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm-3">
                <label className="control-label" htmlFor="elementWidth"><IntlMessages id="width" />:</label>
                <input id="elementWidth" type="text" className="form-control" 
                       pattern="^$|^\d+(px|%)$"
                       onInput={this.validateImageSize}
                       defaultValue={this.props.element.width} 
                       onBlur={this.updateElement.bind(this)} 
                       onChange={this.editElementProp.bind(this, 'width', 'value')} />
              </div>
              <div className="col-sm-3">
                <label className="control-label" htmlFor="elementHeight"><IntlMessages id="height" />:</label>
                <input id="elementHeight" type="text" className="form-control" 
                       pattern="^$|^\d+(px|%)$"
                       onInput={this.validateImageSize}
                       defaultValue={this.props.element.height} 
                       onBlur={this.updateElement.bind(this)} 
                       onChange={this.editElementProp.bind(this, 'height', 'value')} />
              </div>
              <small className="form-text text-muted">
                  Use <code>px</code> or <code>%</code> (e.g. 200px, 100%).
              </small>
            </div>
          </div>
        }
        {this.state.element.element === 'FileUpload' && (
          <div>
            <div className="mb-3">
              <label className="control-label" htmlFor="LabelAfterFileIcon"><IntlMessages id="display-label-after-file-icon" />:</label>
              <input id="LabelAfterFileIcon" type="text" className="form-control" defaultValue={this.props.element.label_after_file_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'label_after_file_icon', 'value')} />
            </div>
            <div className="mb-3">
              <label className="control-label" htmlFor="MessageUnderFileIcon"><IntlMessages id="display-message-under-file-icon" />:</label>
              <input id="MessageUnderFileIcon" type="text" className="form-control" defaultValue={this.props.element.message_under_file_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'message_under_file_icon', 'value')} />
            </div>
            <div className="mb-3">
              <label className="control-label" htmlFor="LabelAfterFileClearIcon"><IntlMessages id="display-label-after-file-clear-icon" />:</label>
              <input id="LabelAfterFileClearIcon" type="text" className="form-control" defaultValue={this.props.element.label_after_file_clear_icon} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'label_after_file_clear_icon', 'value')} />
            </div>
            <div className='mb-3'>
              <label className='control-label' htmlFor='fileType'>
                <IntlMessages id='choose-file-type' />:
              </label>
              <select
                id='fileType'
                className="form-control"
                onBlur={this.updateElement.bind(this)}
                onChange={this.editElementProp.bind(this, 'fileType', 'value')}
              >
                {[
                  {
                    type: 'image, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, video/mp4,video/x-m4v,video/*',
                    typeName: 'All File Type',
                  },
                  { type: 'image', typeName: 'Image' },
                  { type: 'application/pdf', typeName: 'PDF' },
                  {
                    type: 'application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    typeName: 'Word',
                  },
                  {
                    type: 'application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    typeName: 'Excel',
                  },
                  {
                    type: 'application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    typeName: 'Powerpoint',
                  },
                  {
                    type: 'video/mp4,video/x-m4v,video/*',
                    typeName: 'Videos',
                  },
                ].map((file, index) => (
                  <option value={file.type} key={index}>
                    {file.typeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {this.state.element.element === 'Signature' && this.props.element.readOnly
          ? (
            <div className="mb-3">
              <label className="control-label" htmlFor="variableKey"><IntlMessages id="variable-key" />:</label>
              <input id="variableKey" type="text" className="form-control" defaultValue={this.props.element.variableKey} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'variableKey', 'value')} />
              <p className="help-block"><IntlMessages id="variable-key-desc" />.</p>
            </div>
          )
          : (<div/>)
        }

        {canHavePageBreakBefore &&
          <div className="mb-3">
            <label className="control-label"><IntlMessages id="print-options" /></label>
            <div className="form-check">
              <input id="page-break-before-element" className="form-check-input" type="checkbox" checked={this_checked_page_break} value={true} onChange={this.editElementProp.bind(this, 'pageBreakBefore', 'checked')} />
              <label className="form-check-label" htmlFor="page-break-before-element">
              <IntlMessages id="page-break-before-elements" />?
              </label>
            </div>
          </div>
        }

        {canHaveAlternateForm &&
          <div className="mb-3">
            <label className="control-label"><IntlMessages id="alternate-signature-page" /></label>
            <div className="form-check">
              <input id="display-on-alternate" className="form-check-input" type="checkbox" checked={this_checked_alternate_form} value={true} onChange={this.editElementProp.bind(this, 'alternateForm', 'checked')} />
              <label className="form-check-label" htmlFor="display-on-alternate">
              <IntlMessages id="display-on-alternate-signature-page" />?
              </label>
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('step') &&
          <div className="mb-3">
            <div className="form-group-range">
              <label className="control-label" htmlFor="rangeStep"><IntlMessages id="step" /></label>
              <input id="rangeStep" type="number" className="form-control" defaultValue={this.props.element.step} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'step', 'value')} />
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('min_value') &&
          <div className="mb-3">
            <div className="form-group-range">
              <label className="control-label" htmlFor="rangeMin"><IntlMessages id="min" /></label>
              <input id="rangeMin" type="number" className="form-control" defaultValue={this.props.element.min_value} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'min_value', 'value')} />
              <input type="text" className="form-control" defaultValue={this.props.element.min_label} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'min_label', 'value')} />
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('max_value') &&
          <div className="mb-3">
            <div className="form-group-range">
              <label className="control-label" htmlFor="rangeMax"><IntlMessages id="max" /></label>
              <input id="rangeMax" type="number" className="form-control" defaultValue={this.props.element.max_value} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'max_value', 'value')} />
              <input type="text" className="form-control" defaultValue={this.props.element.max_label} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'max_label', 'value')} />
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('default_value') &&
          <div className="mb-3">
            <div className="form-group-range">
              <label className="control-label" htmlFor="defaultSelected"><IntlMessages id="default-selected" /></label>
              <input id="defaultSelected" type="number" className="form-control" defaultValue={this.props.element.default_value} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'default_value', 'value')} />
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('static') && this.props.element.static &&
          <div className="mb-3">
            <label className="control-label"><IntlMessages id="text-style" /></label>
            <div className="form-check">
              <input id="do-bold" className="form-check-input" type="checkbox" checked={this_checked_bold} value={true} onChange={this.editElementProp.bind(this, 'bold', 'checked')} />
              <label className="form-check-label" htmlFor="do-bold">
              <IntlMessages id="bold" />
              </label>
            </div>
            <div className="form-check">
              <input id="do-italic" className="form-check-input" type="checkbox" checked={this_checked_italic} value={true} onChange={this.editElementProp.bind(this, 'italic', 'checked')} />
              <label className="form-check-label" htmlFor="do-italic">
              <IntlMessages id="italic" />
              </label>
            </div>
          </div>
        }
        { this.props.element.showDescription &&
          <div className="mb-3">
            <label className="control-label" htmlFor="questionDescription"><IntlMessages id="description" /></label>
            <TextAreaAutosize type="text" className="form-control" id="questionDescription" defaultValue={this.props.element.description} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'description', 'value')} />
          </div>
        }
        { this.props.showCorrectColumn && this.props.element.canHaveAnswer && !this.props.element.hasOwnProperty('options') &&
          <div className="mb-3">
            <label className="control-label" htmlFor="correctAnswer"><IntlMessages id="correct-answer" /></label>
            <input id="correctAnswer" type="text" className="form-control" defaultValue={this.props.element.correct} onBlur={this.updateElement.bind(this)} onChange={this.editElementProp.bind(this, 'correct', 'value')} />
          </div>
        }
        { this.props.element.canPopulateFromApi && this.props.element.hasOwnProperty('options') &&
          <div className="mb-3">
            <label className="control-label" htmlFor="optionsApiUrl"><IntlMessages id="populate-options-from-api" /></label>
            <div className="row">
              <div className="col-sm-6">
                <input className="form-control" style={{ width: '100%' }} type="text" id="optionsApiUrl" placeholder="http://localhost:8080/api/optionsdata" />
              </div>
              <div className="col-sm-6">
                <button onClick={this.addOptions.bind(this)} className="btn btn-success"><IntlMessages id="populate" /></button>
              </div>
            </div>
          </div>
        }
        { this.props.element.hasOwnProperty('options') &&
          <DynamicOptionList showCorrectColumn={this.props.showCorrectColumn}
            canHaveOptionCorrect={canHaveOptionCorrect}
            canHaveOptionValue={canHaveOptionValue}
            data={this.props.preview.state.data}
            updateElement={this.props.updateElement}
            preview={this.props.preview}
            element={this.props.element}
            key={this.props.element.options.length} />
        }
      </div>
    );
  }
}
FormElementsEdit.defaultProps = { className: 'edit-element-fields' };
