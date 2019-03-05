import React from 'react';
import classnames from 'classnames';

import './Record.scss';
import Attributes from '../Attribute/Attributes';
import DeleteView from '../DeleteView/DeleteView';
import Dropdown from 'components/Dropdown';
import EditorForm from '../EditorForm/EditorForm';
import Popup from 'components/Popup';

export class Record extends React.Component {
  constructor (props) {
    super(props);

    this.disableEditMode = this.disableEditMode.bind(this);
    this.editRecordForm = this.editRecordForm.bind(this);
    this.editRecordWithForm = this.editRecordWithForm.bind(this);
    this.onEditFormShowMoreRecord = this.onEditFormShowMoreRecord.bind(this);
    this.renderRecordButtons = this.renderRecordButtons.bind(this);
    this.updateTypeSpecifier = this.updateTypeSpecifier.bind(this);
    this.updateRecordType = this.updateRecordType.bind(this);
    this.updateRecordAttribute = this.updateRecordAttribute.bind(this);
    this.state = {
      attributes: this.props.record.attributes,
      complementingRecord: false,
      deleting: false,
      editingRecord: false,
      mode: 'view',
      typeSpecifier: this.props.record.attributes.TypeSpecifier,
      type: this.props.record.attributes.RecordType
    };
  }

  setMode (value) {
    this.setState({ mode: value });
  }

  disableEditMode () {
    this.setState({
      editingRecord: false,
      complementingRecord: false,
      mode: 'view'
    });
  }

  editRecordForm () {
    if (this.props.documentState === 'edit') {
      this.setState({ editingRecord: true, mode: 'edit' });
    }
  }

  editRecordWithForm (attributes, recordId, disableEditMode = true) {
    this.props.editRecord(attributes, recordId);
    if (disableEditMode) {
      this.disableEditMode();
    }
  }

  mergeChildAttributesToStateAttributes = (stateAttrs, childattrs) => {
    const newAttrs = {};
    // Gather attributes from child & assign them to current state record
    Object.keys(stateAttrs).map((key) => Object.assign(newAttrs, { [key]: childattrs[key] && childattrs[key]['value'] }));
    return newAttrs;
  }

  onEditFormShowMoreRecord (e, { newAttributes }) {
    e.preventDefault();
    this.setState(prevState => {
      const newAttrs = this.mergeChildAttributesToStateAttributes(prevState.attributes, newAttributes);

      return {
        complementingRecord: !prevState.complementingRecord,
        editingRecord: !prevState.editingRecord,
        attributes: {
          ...prevState.attributes,
          ...newAttrs
        }
      };
    });
  }

  updateTypeSpecifier (typeSpecifier, recordId) {
    this.setState({
      typeSpecifier: typeSpecifier
    });
    const updatedTypeSpecifier = {
      typeSpecifier: typeSpecifier,
      recordId: recordId
    };
    this.props.editRecordAttribute(updatedTypeSpecifier);
  }

  updateRecordType (type, recordId) {
    this.setState({
      type: type
    });
    const updatedRecordType = {
      type: type,
      recordId: recordId
    };
    this.props.editRecordAttribute(updatedRecordType);
  }

  updateRecordAttribute (attribute, attributeIndex, recordId) {
    this.setState({
      attributes: {
        [attributeIndex]: attribute
      }
    });
    const updatedRecordAttribute = { attribute, attributeIndex, recordId };
    this.props.editRecordAttribute(updatedRecordAttribute);
  }

  cancelDeletion () {
    this.setState({ deleting: false });
  }

  delete () {
    this.setState({ deleting: false });
    this.props.removeRecord(this.props.record.id, this.props.record.action);
  }

  showAttributeButton (attributes) {
    const actualAttributes = [];
    for (const key in attributes) {
      if (key !== 'TypeSpecifier' && key !== 'RecordType') {
        actualAttributes.push(key);
      }
    }
    if (actualAttributes.length) {
      return true;
    }
    return false;
  }

  renderRecordButtons () {
    if (this.state.mode === 'view') {
      return (
        <div className='record-button-group'>
          { this.props.documentState === 'edit' &&
          <Dropdown
            items={[
              {
                text: 'Muokkaa asiakirjaa',
                icon: 'fa-pencil',
                style: 'btn-primary',
                action: () => this.editRecordForm()
              },
              // {
              //   text: 'Täydennä metatietoja',
              //   icon: 'fa-plus-square',
              //   style: 'btn-primary',
              //   action: () => this.props.complementRecordForm(
              //     this.props.record.id,
              //     this.props.record.attributes
              //   )
              // },
              {
                text: 'Poista asiakirja',
                icon: 'fa-trash',
                style: 'btn-delete',
                action: () => this.setState({ deleting: true })
              }
            ]}
            extraSmall={true}
          />
          }
          { this.showAttributeButton(this.props.record.attributes) &&
            <button
              className='btn btn-info btn-xs record-button pull-right'
              onClick={() => this.props.setRecordVisibility(
                this.props.record.id,
                !this.props.record.is_open
              )}>
              <span
                className={'fa ' + (this.props.record.is_open ? 'fa-minus' : 'fa-plus')}
                aria-hidden='true'
              />
            </button>
          }
        </div>
      );
    }
  }

  render () {
    const { attributeTypes, recordTypes, record, documentState } = this.props;
    const { mode } = this.state;

    return (
      <div
        className={classnames(
          'record col-xs-12',
          { 'record-open' : record.is_open },
          { 'record-closed': !record.is_open }
        )}
      >
        <div id={record.id}>
          {mode === 'edit' &&
            this.state.editingRecord && (
            <EditorForm
              onShowMore={this.onEditFormShowMoreRecord}
              targetId={record.id}
              attributes={record.attributes}
              attributeTypes={this.props.attributeTypes}
              elementConfig={{
                elementTypes: recordTypes,
                editWithForm: this.editRecordWithForm
              }}
              editorConfig={{
                type: 'record',
                action: 'edit'
              }}
              closeEditorForm={this.disableEditMode}
              displayMessage={this.props.displayMessage}
            />
          )}
          {mode === 'edit' &&
            this.state.complementingRecord && (
            <EditorForm
              onShowMore={this.onEditFormShowMoreRecord}
              targetId={record.id}
              attributes={record.attributes}
              attributeTypes={this.props.attributeTypes}
              elementConfig={{
                elementTypes: recordTypes,
                editWithForm: this.editRecordWithForm
              }}
              editorConfig={{
                type: 'record',
                action: 'complement',
                from: 'editRecord'
              }}
              closeEditorForm={this.disableEditMode}
              displayMessage={this.props.displayMessage}
            />
          )}
          {!this.state.editingRecord &&
            !this.state.complementingRecord && (
            <Attributes
              element={record}
              documentState={documentState}
              type={'record'}
              attributeTypes={attributeTypes}
              typeOptions={recordTypes}
              renderButtons={this.renderRecordButtons}
              updateTypeSpecifier={this.updateTypeSpecifier}
              updateType={this.updateRecordType}
              updateAttribute={this.updateRecordAttribute}
              showAttributes={record.is_open}
            />
          )}
          {this.state.deleting &&
          <Popup
            content={
              <DeleteView
                type='record'
                target={record.attributes.TypeSpecifier || record.attributes.RecordType || '---'}
                action={() => this.delete()}
                cancel={() => this.cancelDeletion()}
              />
            }
            closePopup={() => this.cancelDeletion()}
          />
          }
        </div>
      </div>
    );
  }
}

Record.propTypes = {
  attributeTypes: React.PropTypes.object.isRequired,
  // complementRecordForm: React.PropTypes.func.isRequired,
  displayMessage: React.PropTypes.func.isRequired,
  documentState: React.PropTypes.string.isRequired,
  editRecord: React.PropTypes.func.isRequired,
  editRecordAttribute: React.PropTypes.func.isRequired,
  record: React.PropTypes.object.isRequired,
  recordTypes: React.PropTypes.object.isRequired,
  removeRecord: React.PropTypes.func.isRequired,
  setRecordVisibility: React.PropTypes.func.isRequired
};

export default Record;
