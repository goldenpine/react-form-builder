/**
  * <Preview />
  */

import React from 'react';
import update from 'immutability-helper';
import store from './stores/store';
import FormElementsEdit from './form-dynamic-edit';
import SortableFormElements from './sortable-form-elements';
import CustomDragLayer from './form-elements/component-drag-layer';

const { PlaceHolder } = SortableFormElements;

export default class Preview extends React.Component {
  state = {
    data: [],
    answer_data: {},
    // make edit form movable state
    editFormPosition: { x: 100, y: 100 },
    dragging: false,
    dragOffset: null,
  };

  constructor(props) {
    super(props);

    const { onLoad, onPost } = props;
    store.setExternalHandler(onLoad, onPost);

    // eidtForm is for Element Property Edit, 
    // used to detect clicks outside the edit panel and to make it draggable
    this.editForm = React.createRef();
    this._editFormListenerAttached = false; // <-- track listener
    this.state = {
      data: props.data || [],
      answer_data: {},
      editFormPosition: { x: 100, y: 100 },
      dragging: false,
      dragOffset: null,
    };
    this.seq = 0;

    this._onUpdate = this._onChange.bind(this);
    this.getDataById = this.getDataById.bind(this);
    this.moveCard = this.moveCard.bind(this);
    this.insertCard = this.insertCard.bind(this);
    this.setAsChild = this.setAsChild.bind(this);
    this.removeChild = this.removeChild.bind(this);
    this._onDestroy = this._onDestroy.bind(this);
  }

  componentDidMount() {
    const { data, url, saveUrl, saveAlways } = this.props;
    store.subscribe(state => this._onUpdate(state.data));
    store.dispatch('load', { loadUrl: url, saveUrl, data: data || [], saveAlways });
    document.addEventListener('mousedown', this.editModeOff);

    // attach drag start on the edit form container if present
    if (this.editForm && this.editForm.current) {
      this.editForm.current.addEventListener('mousedown', this.onEditFormMouseDown);
      this._editFormListenerAttached = true;
    }
  }

  componentDidUpdate(prevProps) {
    // attach/detach mousedown listener when edit panel opens/closes
    const wasOpen = !!prevProps.editElement;
    const isOpen = !!this.props.editElement;

    if (!wasOpen && isOpen) {
      // always (re)attach the listener to the current DOM node when opening.
      if (this.editForm && this.editForm.current) {
        // defensive remove in case a stale listener flag is set
        try {
          this.editForm.current.removeEventListener('mousedown', this.onEditFormMouseDown);
        } catch (e) { /* ignore */ }
        this.editForm.current.addEventListener('mousedown', this.onEditFormMouseDown);
        this._editFormListenerAttached = true;
      } else {
        this._editFormListenerAttached = false;
      }
    } else if (wasOpen && !isOpen) {
      // mark as detached so future opens will reattach; remove if node still exists
      if (this.editForm && this.editForm.current && this._editFormListenerAttached) {
        this.editForm.current.removeEventListener('mousedown', this.onEditFormMouseDown);
      }
      this._editFormListenerAttached = false;
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.editModeOff);

    if (this.editForm && this.editForm.current && this._editFormListenerAttached) {
      this.editForm.current.removeEventListener('mousedown', this.onEditFormMouseDown);
      this._editFormListenerAttached = false;
    }
    document.removeEventListener('mousemove', this.onEditFormDrag);
    document.removeEventListener('mouseup', this.onEditFormMouseUp);
  }

  // start dragging the edit form (ignore clicks on inputs/buttons)
  onEditFormMouseDown = (e) => {
    const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
    if (['input', 'textarea', 'select', 'button', 'a', 'label'].includes(tag)) {
      return;
    }
    if (!this.editForm.current) return;
    const rect = this.editForm.current.getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this.setState({ dragging: true, dragOffset: offset });
    document.addEventListener('mousemove', this.onEditFormDrag);
    document.addEventListener('mouseup', this.onEditFormMouseUp);
    e.stopPropagation();
    e.preventDefault();
  }

  onEditFormDrag = (e) => {
    if (!this.state.dragging || !this.state.dragOffset) return;
    const x = e.clientX - this.state.dragOffset.x;
    const y = e.clientY - this.state.dragOffset.y;
    this.setState({ editFormPosition: { x, y } });
  }

  onEditFormMouseUp = (e) => {
    if (this.state.dragging) {
      this.setState({ dragging: false, dragOffset: null });
      document.removeEventListener('mousemove', this.onEditFormDrag);
      document.removeEventListener('mouseup', this.onEditFormMouseUp);
    }
    e.stopPropagation();
  }

  editModeOff = (e) => {
    if (this.editForm.current && !this.editForm.current.contains(e.target)) {
      this.manualEditModeOff();
    }
  }

  manualEditModeOff = () => {
    const { editElement } = this.props;
    if (editElement && editElement.dirty) {
      editElement.dirty = false;
      this.updateElement(editElement);
    }
    this.props.manualEditModeOff();
  }

  _setValue(text) {
    return text.replace(/[^A-Z0-9]+/ig, '_').toLowerCase();
  }

  updateElement(element) {
    const { data } = this.state;
    let found = false;

    for (let i = 0, len = data.length; i < len; i++) {
      if (element.id === data[i].id) {
        data[i] = element;
        found = true;
        break;
      }
    }

    if (found) {
      this.seq = this.seq > 100000 ? 0 : this.seq + 1;
      store.dispatch('updateOrder', data);
    }
  }

  _onChange(data) {
    const answer_data = {};

    data.forEach((item) => {
      if (item && item.readOnly && this.props.variables[item.variableKey]) {
        answer_data[item.field_name] = this.props.variables[item.variableKey];
      }
    });

    this.setState({
      data,
      answer_data,
    });
  }

  _onDestroy(item) {
    if (item.childItems) {
      item.childItems.forEach(x => {
        const child = this.getDataById(x);
        if (child) {
          store.dispatch('delete', child);
        }
      });
    }
    store.dispatch('delete', item);
  }

  getDataById(id) {
    const { data } = this.state;
    return data.find(x => x && x.id === id);
  }

  swapChildren(data, item, child, col) {
    if (child.col !== undefined && item.id !== child.parentId) {
      return false;
    }
    if (!(child.col !== undefined && child.col !== col && item.childItems[col])) {
      // No child was assigned yet in both source and target.
      return false;
    }
    const oldId = item.childItems[col];
    const oldItem = this.getDataById(oldId);
    const oldCol = child.col;
    // eslint-disable-next-line no-param-reassign
    item.childItems[oldCol] = oldId; oldItem.col = oldCol;
    // eslint-disable-next-line no-param-reassign
    item.childItems[col] = child.id; child.col = col;
    store.dispatch('updateOrder', data);
    return true;
  }

  setAsChild(item, child, col, isBusy) {
    const { data } = this.state;
    if (this.swapChildren(data, item, child, col)) {
      return;
    } if (isBusy) {
      return;
    }
    const oldParent = this.getDataById(child.parentId);
    const oldCol = child.col;
    // eslint-disable-next-line no-param-reassign
    item.childItems[col] = child.id; child.col = col;
    // eslint-disable-next-line no-param-reassign
    child.parentId = item.id;
    // eslint-disable-next-line no-param-reassign
    child.parentIndex = data.indexOf(item);
    if (oldParent) {
      oldParent.childItems[oldCol] = null;
    }
    const list = data.filter(x => x && x.parentId === item.id);
    const toRemove = list.filter(x => item.childItems.indexOf(x.id) === -1);
    let newData = data;
    if (toRemove.length) {
      // console.log('toRemove', toRemove);
      newData = data.filter(x => toRemove.indexOf(x) === -1);
    }
    if (!this.getDataById(child.id)) {
      newData.push(child);
    }
    store.dispatch('updateOrder', newData);
  }

  removeChild(item, col) {
    const { data } = this.state;
    const oldId = item.childItems[col];
    const oldItem = this.getDataById(oldId);
    if (oldItem) {
      const newData = data.filter(x => x !== oldItem);
      // eslint-disable-next-line no-param-reassign
      item.childItems[col] = null;
      // delete oldItem.parentId;
      this.seq = this.seq > 100000 ? 0 : this.seq + 1;
      store.dispatch('updateOrder', newData);
      this.setState({ data: newData });
    }
  }

  restoreCard(item, id) {
    const { data } = this.state;
    const parent = this.getDataById(item.data.parentId);
    const oldItem = this.getDataById(id);
    if (parent && oldItem) {
      const newIndex = data.indexOf(oldItem);
      const newData = [...data]; // data.filter(x => x !== oldItem);
      // eslint-disable-next-line no-param-reassign
      parent.childItems[oldItem.col] = null;
      delete oldItem.parentId;
      // eslint-disable-next-line no-param-reassign
      delete item.setAsChild;
      // eslint-disable-next-line no-param-reassign
      delete item.parentIndex;
      // eslint-disable-next-line no-param-reassign
      item.index = newIndex;
      this.seq = this.seq > 100000 ? 0 : this.seq + 1;
      store.dispatch('updateOrder', newData);
      this.setState({ data: newData });
    }
  }

  insertCard(item, hoverIndex, id) {
    const { data } = this.state;
    if (id) {
      this.restoreCard(item, id);
    } else {
      data.splice(hoverIndex, 0, item);
      this.saveData(item, hoverIndex, hoverIndex);
      store.dispatch('insertItem', item);
    }
  }

  moveCard(dragIndex, hoverIndex) {
    const { data } = this.state;
    const dragCard = data[dragIndex];
    // happens sometimes when you click to insert a new item from the toolbox
    if (dragCard !== undefined) {
      this.saveData(dragCard, dragIndex, hoverIndex);
    }
  }

  // eslint-disable-next-line no-unused-vars
  cardPlaceHolder(dragIndex, hoverIndex) {
    // Dummy
  }

  saveData(dragCard, dragIndex, hoverIndex) {
    const newData = update(this.state, {
      data: {
        $splice: [[dragIndex, 1], [hoverIndex, 0, dragCard]],
      },
    });
    this.setState(newData);
    store.dispatch('updateOrder', newData.data);
  }

  getElement(item, index) {
    if (item.custom) {
      if (!item.component || typeof item.component !== 'function') {
        // eslint-disable-next-line no-param-reassign
        item.component = this.props.registry.get(item.key);
      }
    }
    const SortableFormElement = SortableFormElements[item.element];

    if (SortableFormElement === null) {
      return null;
    }
    return <SortableFormElement id={item.id} seq={this.seq} index={index} moveCard={this.moveCard} insertCard={this.insertCard} mutable={false} parent={this.props.parent} editModeOn={this.props.editModeOn} isDraggable={true} key={item.id} sortData={item.id} data={item} getDataById={this.getDataById} setAsChild={this.setAsChild} removeChild={this.removeChild} _onDestroy={this._onDestroy} />;
  }

  showEditForm() {
    const handleUpdateElement = (element) => this.updateElement(element);
    handleUpdateElement.bind(this);

    const formElementEditProps = {
      showCorrectColumn: this.props.showCorrectColumn,
      files: this.props.files,
      manualEditModeOff: this.manualEditModeOff,
      preview: this,
      element: this.props.editElement,
      updateElement: handleUpdateElement,
    };

    return this.props.renderEditForm(formElementEditProps);
  }

  render() {
    let classes = this.props.className;
    if (this.props.editMode) { classes += ' is-editing'; }
    const data = this.state.data.filter(x => !!x && !x.parentId);
    const items = data.map((item, index) => this.getElement(item, index));

    const editFormStyle = {
      position: 'fixed',
      left: this.state.editFormPosition.x,
      top: this.state.editFormPosition.y,
      zIndex: 9999,
      cursor: this.state.dragging ? 'grabbing' : 'move',
    };

    return (
      <div className={classes}>
        { /* only render the edit-form container when an element is open */ }
        {this.props.editElement !== null && (
          <div className="edit-form" ref={this.editForm} style={editFormStyle}>
            {this.showEditForm()}
          </div>
        )}
        <div className="Sortable">{items}</div>
        <PlaceHolder id="form-place-holder" show={items.length === 0} index={items.length} moveCard={this.cardPlaceHolder} insertCard={this.insertCard} />
        <CustomDragLayer/>
      </div>
    );
  }
}
Preview.defaultProps = {
  showCorrectColumn: false,
  files: [],
  editMode: false,
  editElement: null, // element currently being edited
  className: 'col-md-9 react-form-builder-preview float-start',
  renderEditForm: props => <FormElementsEdit {...props} />,
};
