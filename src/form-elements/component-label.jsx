import React from 'react';
import myxss from './myxss';

const ComponentLabel = (props) => {
  const hasRequiredLabel =
    props.data.hasOwnProperty('required') &&
    props.data.required === true &&
    !props.read_only;
  const labelText = myxss.process(props.data.label);
  if (!labelText) {
    return null;
  }

  // Since we use <div> to replace <span> in the label in form-elements-edit.jsx to support multiple-line labels,
  // we need to ensure that the required label, *,  is inserted correctly.
  // If it's simply appended the label string, it will show on a new line.
  // The workaround is to insert it before the first closing </div> or </li> tag if it exists,
  // so it appears at the end of the first line of the label.
  let updatedLabel = labelText;
  if (hasRequiredLabel) {
    const insertSpan = '<span class="label-required" style="color:red;">*</span>';
    const closingTagRegex = /<\/(div|li)>/i; // case-insensitive match for </div> or </li>

    if (closingTagRegex.test(labelText)) {
      updatedLabel = labelText.replace(closingTagRegex, `${insertSpan}</$1>`);
    } else {
      // Neither </div> nor </li> found — append at the end
      updatedLabel = labelText + insertSpan;
    }
  }

  return (
    <label className={props.className || 'form-label'}>
      <span dangerouslySetInnerHTML={{ __html: updatedLabel }} />
    </label>
  );
};

export default ComponentLabel;
