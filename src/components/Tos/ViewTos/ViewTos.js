import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, routerShape } from 'react-router';
import DatePicker from 'react-datepicker';
import { StickyContainer, Sticky } from 'react-sticky';
import moment from 'moment';
import classnames from 'classnames';
import { includes } from 'lodash';

import Phase from 'components/Tos/Phase/Phase';
import AddElementInput from 'components/Tos/AddElementInput/AddElementInput';
import Attribute from 'components/Tos/Attribute/Attribute';
import ReorderView from 'components/Tos/Reorder/ReorderView';
import ImportView from 'components/Tos/ImportView/ImportView';
import CloneView from 'components/Tos/CloneView/CloneView';
import EditorForm from 'components/Tos/EditorForm/EditorForm';
import TosHeader from 'components/Tos/Header/TosHeader';
import ClassificationHeader from 'components/Tos/Header/ClassificationHeader';
import ValidationBarContainer from 'components/Tos/ValidationBar/ValidationBarContainer';
import ValidationBarHeader from 'components/Tos/ValidationBarHeader/ValidationBarHeader';

import Popup from 'components/Popup';

import { formatDateTime, getStatusLabel } from '../../../utils/helpers';
import {
  validateTOS,
  validatePhase,
  validateAction,
  validateRecord,
  validateConditionalRules
} from '../../../utils/validators';

import './ViewTos.scss';

export class ViewTOS extends React.Component {
  constructor (props) {
    super(props);
    this.setDocumentState = this.setDocumentState.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.cancelMetaDataEdit = this.cancelMetaDataEdit.bind(this);
    this.cancelMetaDataComplement = this.cancelMetaDataComplement.bind(this);
    this.cancelPhaseCreation = this.cancelPhaseCreation.bind(this);
    this.changeStatus = this.changeStatus.bind(this);
    this.cloneFromTemplate = this.cloneFromTemplate.bind(this);
    this.createNewPhase = this.createNewPhase.bind(this);
    this.editMetaDataWithForm = this.editMetaDataWithForm.bind(this);
    this.fetchTOS = this.fetchTOS.bind(this);
    this.generateEditorFormValidDateFields = this.generateEditorFormValidDateFields.bind(this);
    this.generateEditorFormValidDateField = this.generateEditorFormValidDateField.bind(this);
    this.onValidationFilterChange = this.onValidationFilterChange.bind(this);
    this.onPhaseDefaultAttributeChange = this.onPhaseDefaultAttributeChange.bind(this);
    this.onPhaseTypeChange = this.onPhaseTypeChange.bind(this);
    this.onPhaseTypeInputChange = this.onPhaseTypeInputChange.bind(this);
    this.onPhaseTypeSpecifierChange = this.onPhaseTypeSpecifierChange.bind(this);
    this.onValidDateChange = this.onValidDateChange.bind(this);
    this.routerWillLeave = this.routerWillLeave.bind(this);
    this.saveDraft = this.saveDraft.bind(this);
    this.setPhaseVisibility = this.setPhaseVisibility.bind(this);
    this.updateFunctionAttribute = this.updateFunctionAttribute.bind(this);
    this.setTosVisibility = this.setTosVisibility.bind(this);
    this.setValidationVisibility = this.setValidationVisibility.bind(this);
    this.review = this.review.bind(this);
    this.onEditFormShowMoreMetaData = this.onEditFormShowMoreMetaData.bind(this);
    this.onAddFormShowMorePhase = this.onAddFormShowMorePhase.bind(this);

    this.state = {
      createPhaseMode: false,
      validationFilter: '',
      phaseDefaultAttributes: {},
      phaseTypeSpecifier: '',
      phaseType: '',
      originalTos: {},
      isDirty: false,
      showCloneView: false,
      showImportView: false,
      showReorderView: false,
      showMore: false,
      validFrom: null,
      validFromEditing: false,
      validTo: null,
      validToEditing: false
    };
  }

  componentDidMount () {
    const { params: { id, version }, router, route } = this.props;
    router.setRouteLeaveHook(route, this.routerWillLeave);
    let params = {};
    if (typeof version !== 'undefined') {
      params.version = version;
    }

    this.fetchTOS(id, params);
  }

  componentWillReceiveProps (nextProps) {
    const { route } = nextProps;
    // If we have selectedTOS & selectedTOS hasn't change during receiveProps
    // => cache it to state to be able to discard changes
    if (
      ((this.props.selectedTOS.id || nextProps.selectedTOS.id) &&
        nextProps.selectedTOS.id !== this.props.selectedTOS.id) ||
      nextProps.selectedTOS.version !== this.props.selectedTOS.version
    ) {
      this.setState({ originalTos: nextProps.selectedTOS });
    }

    if (
      nextProps.params.id !== this.props.params.id ||
      nextProps.params.version !== this.props.params.version
    ) {
      const { id, version } = nextProps.params;
      const params = {};
      if (typeof version !== 'undefined') {
        params.version = version;
      }
      this.fetchTOS(id, params);
    }

    if (route && route.path === 'view-tos/:id') {
      this.props.setNavigationVisibility(false);
    }

    if (nextProps.selectedTOS.documentState === 'view') {
      this.setState({
        editingMetaData: false,
        validFromEditing: false,
        validToEditing: false,
        complementingMetaData: false
      });
    }
  }

  componentWillUnmount () {
    this.props.clearTOS();
    this.props.setValidationVisibility(false);
  }

  onEditFormShowMoreMetaData (e) {
    e.preventDefault();
    this.setState(prevState => ({
      complementingMetaData: !prevState.complementingMetaData,
      editingMetaData: !prevState.editingMetaData
    })
    );
  }

  routerWillLeave (e) {
    const { isDirty } = this.state;

    if (isDirty) {
      const message = 'Muutoksia ei ole tallennettu, haluatko silti jatkaa?';
      (e || window.event).returnValue = message;
      return message;
    }
  }

  fetchTOS (id, params = {}) {
    this.props
      .fetchTOS(id, params)
      .then(() => {
        this.props.setNavigationVisibility(false);
        if (includes(window.location.pathname, '/all')) {
          this.props.setTosVisibility(this.props.selectedTOS, true, true);
        }
      })
      .catch(err => {
        if (err instanceof URIError) {
          // We have a 404 from API
          if (this.props.isUser) {
            this.props.push(`/404?tos-id=${id}`);
          } else {
            this.props.login();
          }
        }
      });
  }

  review (status) {
    if (this.validateAttributes()) {
      this.changeStatus(status);
    } else {
      this.setState({ invalidAttributes: this.validateAttributes });
      this.props.setValidationVisibility(true);
    }
  }

  validateAttributes () {
    const { selectedTOS, attributeTypes } = this.props;
    const invalidTOSAttributes =
      validateTOS(selectedTOS, attributeTypes).length > 0;
    const invalidPhaseAttributes = !this.evaluateAttributes(
      selectedTOS.phases,
      validatePhase,
      attributeTypes
    );
    const invalidActionAttributes = !this.evaluateAttributes(
      selectedTOS.actions,
      validateAction,
      attributeTypes
    );
    const invalidRecordAttributes = !this.evaluateAttributes(
      selectedTOS.records,
      validateRecord,
      attributeTypes
    );
    return (
      !invalidTOSAttributes &&
      !invalidPhaseAttributes &&
      !invalidActionAttributes &&
      !invalidRecordAttributes
    );
  }

  evaluateAttributes (items, validate, attributeTypes) {
    if (Object.keys(items).length > 0) {
      for (const item in items) {
        const validAttributes =
          validate(items[item], attributeTypes).length === 0;
        if (!validAttributes) {
          return false;
        }
      }
    }
    return true;
  }

  setDocumentState (state) {
    return this.setState({ isDirty: true }, () => {
      return this.props.setDocumentState(state);
    });
  }

  setValidationVisibility (value) {
    this.props.setValidationVisibility(value);
  }

  setTosVisibility (basicDataVisibility, metaDataVisibility) {
    this.props.setTosVisibility(this.props.selectedTOS, basicDataVisibility, metaDataVisibility);
    this.props.replace(`/view-tos/${this.props.selectedTOS.id}${basicDataVisibility && metaDataVisibility ? '/all' : ''}`);
  }

  cancelEdit () {
    return this.setState({ isDirty: false }, () => {
      return this.props.resetTOS(this.state.originalTos);
    });
  }

  cancelMetaDataEdit () {
    const { validFrom, validTo } = this.state;
    this.setState({ editingMetaData: false });
    this.props.editValidDates({ validFrom, validTo });
  }

  cancelMetaDataComplement () {
    const { validFrom, validTo } = this.state;
    this.setState({ complementingMetaData: false });
    this.props.editValidDates({ validFrom, validTo });
  }

  saveDraft () {
    this.setState({ isDirty: false });
    return this.props
      .saveDraft()
      .then(() => {
        if (includes(window.location.pathname, '/all')) {
          this.props.replace(`/view-tos/${this.props.selectedTOS.id}`);
        }
        return this.props.displayMessage({
          title: 'Luonnos',
          body: 'Luonnos tallennettu!'
        });
      })
      .catch(err => {
        return this.props.displayMessage(
          {
            title: 'Virhe',
            body: `"${err.message}"`
          },
          { type: 'error' }
        );
      });
  }

  changeStatus (status) {
    const { state } = this.props.selectedTOS;
    return this.props
      .changeStatus(status)
      .then(() => {
        return this.props.displayMessage({
          title: 'Tila vaihdettu!',
          body: `${getStatusLabel(state)} => ${getStatusLabel(status)}`
        });
      })
      .catch(err => {
        return this.props.displayMessage(
          {
            title: 'Virhe',
            body: `"${err.message}"`
          },
          { type: 'error' }
        );
      });
  }

  addPhase () {
    this.setState({ createPhaseMode: true });
  }

  createNewPhase (event) {
    event.preventDefault();
    this.props.addPhase(
      this.state.phaseTypeSpecifier || '',
      this.state.phaseType || '',
      this.state.phaseDefaultAttributes || {},
      this.props.selectedTOS.id
    );
    this.setState({
      createPhaseMode: false,
      phaseDefaultAttributes: {},
      phaseTypeSpecifier: '',
      phaseType: ''
    });
    this.props.displayMessage({
      title: 'Käsittelyvaihe',
      body: 'Käsittelyvaiheen lisäys onnistui!'
    });
  }

  cancelPhaseCreation (event) {
    event.preventDefault();
    this.setState({
      phaseDefaultAttributes: {},
      phaseTypeSpecifier: '',
      createPhaseMode: false
    });
  }

  cloneFromTemplate (selectedMethod, id) {
    const { cloneFromTemplate } = this.props;
    return cloneFromTemplate(selectedMethod, id)
      .then(() => {
        return this.props.displayMessage({
          title: 'Kuvaus',
          body: 'Kuvauksen tuonti onnistui!'
        });
      })
      .catch(err => {
        return this.props.displayMessage(
          {
            title: 'Virhe',
            body: `"${err.message}"`
          },
          { type: 'warning' }
        );
      });
  }

  onPhaseDefaultAttributeChange (key, value) {
    const { phaseDefaultAttributes } = this.state;
    phaseDefaultAttributes[key] = value;
    this.setState({ phaseDefaultAttributes });
  }

  onPhaseTypeSpecifierChange (event) {
    this.setState({ phaseTypeSpecifier: event.target.value });
  }

  onPhaseTypeChange (value) {
    this.setState({ phaseType: value });
  }

  onPhaseTypeInputChange (event) {
    this.setState({ phaseType: event.target.value });
  }

  updateFunctionAttribute (attribute, attributeIndex) {
    const updatedTOSAttribute = {
      tosAttribute: attribute,
      attributeIndex
    };
    this.props.editRecordAttribute(updatedTOSAttribute);
  }

  editMetaDataWithForm (attributes, stopEditing = true) {
    if (stopEditing) {
      this.setState({
        editingMetaData: false,
        complementingMetaData: false
      });
    }
    this.props.editMetaData(attributes);
  }

  setPhaseVisibility (x, y) {
    this.props.setPhaseVisibility(x, y);
  }

  toggleReorderView () {
    const current = this.state.showReorderView;
    this.setState({ showReorderView: !current });
  }

  toggleImportView () {
    const current = this.state.showImportView;
    this.setState({ showImportView: !current });
  }

  toggleCloneView () {
    const current = this.state.showCloneView;
    this.setState({ showCloneView: !current });
  }

  generateDefaultAttributes (attributeTypes, type) {
    const attributes = {};
    for (const key in attributeTypes) {
      if (attributeTypes.hasOwnProperty(key) && ((this.state.showMore && attributeTypes[key].allowedIn.indexOf(type) >= 0 && key !== 'PhaseType') || (!this.state.showMore && attributeTypes[key].defaultIn.indexOf(type) >= 0)) && key !== 'TypeSpecifier') {
        attributes[key] = attributeTypes[key];

        if (attributeTypes[key].requiredIf.length) {
          if (
            validateConditionalRules(key, attributeTypes)
          ) {
            attributes[key] = attributeTypes[key];
          }
        } else {
          attributes[key] = attributeTypes[key];
        }
      }
    }
    return attributes;
  }

  onAddFormShowMorePhase (e) {
    e.preventDefault();
    this.setState(prevState => ({
      showMore: !prevState.showMore
    })
    );
  }

  generateTypeOptions (typeOptions) {
    const options = [];

    for (const key in typeOptions) {
      if (typeOptions.hasOwnProperty(key)) {
        options.push({
          label: typeOptions[key].value,
          value: typeOptions[key].value
        });
      }
    }

    return options;
  }

  generateMetaDataButtons () {
    const {
      documentState,
      is_open: isOpen,
      valid_from: validFrom,
      valid_to: validTo
    } = this.props.selectedTOS;
    const isEdit = documentState === 'edit';
    return (
      <div className='pull-right'>
        {isEdit && <button className='btn btn-link' onClick={() => this.toggleCloneView()}>Tuo kuvaus</button>}
        {isEdit && (
          <button
            className='btn btn-link'
            onClick={() => this.setState({ editingMetaData: true, validFrom, validTo })}
          >
            Muokkaa metatietoja
          </button>
        )}
        <button
          type='button'
          className='btn btn-info btn-sm'
          title={isOpen ? 'Pienennä' : 'Laajenna'}
          onClick={() => this.props.setMetadataVisibility(!isOpen)}
        >
          <span
            className={
              'fa ' + (isOpen ? 'fa-minus' : 'fa-plus')
            }
            aria-hidden='true'
          />
        </button>
      </div>
    );
  }

  generateMetaData (attributeTypes, attributes) {
    const {
      documentState,
      is_open: isOpen
    } = this.props.selectedTOS;
    const attributeElements = [];

    for (const key in attributeTypes) {
      if (attributes.hasOwnProperty(key) && attributes[key] || key === 'InformationSystem') {
        attributeElements.push(
          <Attribute
            key={key}
            attributeIndex={key}
            attributeKey={this.props.attributeTypes[key].name}
            attribute={attributes[key]}
            type='attribute'
            attributeTypes={attributeTypes}
            documentState={documentState}
            editable={true}
            editRecord={this.props.editRecord}
            showAttributes={isOpen}
            tosAttribute={true}
            updateFunctionAttribute={this.updateFunctionAttribute}
            parentType='function'
          />
        );
      }
    }

    const metadataElement = (
      <div>
        <div
          className={
            'metadata-data-row__secondary ' +
            (this.props.selectedTOS.is_open ? '' : 'hidden')
          }
        >
          {attributeElements}
        </div>
      </div>
    );

    return metadataElement;
  }

  generateVersionData (attributeTypes, attributes) {
    const {
      modified_at,
      documentState,
      editRecord,
      state,
      modified_by: modifiedBy,
      valid_from: validFrom,
      valid_to: validTo
    } = this.props.selectedTOS;
    const { validFromEditing, validToEditing } = this.state;
    const formattedDateTime = formatDateTime(modified_at);
    const versionDataElements = [];
    const validFromData = this.generateValidDateField('Voimassaolo alkaa', 'validFrom', validFrom, validFromEditing);
    const validToData = this.generateValidDateField('Voimassaolo päättyy', 'validTo', validTo, validToEditing);
    const versionData = [
      { type: 'Tila', name: getStatusLabel(state) },
      {
        type: 'Muokkausajankohta, muokkaaja',
        name: `${formattedDateTime}${typeof modifiedBy === 'string' ? `, ${modifiedBy}` : ''}`
      }
    ];

    versionData.map((metadata, index) => {
      versionDataElements.push(
        <Attribute
          key={index}
          attributeIndex={metadata.type}
          attributeKey={metadata.type}
          attribute={metadata.name}
          documentState={documentState}
          attributeTypes={attributeTypes}
          type='attribute'
          editable={false}
          editRecord={editRecord}
          showAttributes={true}
          parentType='function'
        />
      );
    });

    const metadataElement = (
      <div>
        <div className='metadata-data-row__primary'>
          {versionDataElements}
        </div>
        {!this.state.editingMetaData &&
          !this.state.complementingMetaData && (
          <div className='metadata-data-row__primary'>
            {validFromData}
            {validToData}
          </div>
        )}
      </div>
    );

    return metadataElement;
  }

  generateValidDateField (label, field, value, editing) {
    if (editing) {
      return (
        <div className='list-group-item col-xs-6 datepicker-field'>
          <strong>{label}:</strong>
          <DatePicker
            autoFocus={true}
            dateFormat='D.M.YYYY'
            isClearable={true}
            locale='fi-fi'
            placeholderText='PP.KK.VVVV'
            selected={value ? moment(value) : null}
            onChange={(date) => this.onValidDateChange(field, date)}
          />
        </div>
      );
    }
    return (
      <a
        onClick={() => this.activateValidDateEditMode(field)}
        className='list-group-item col-xs-6 attribute-basic'
      >
        <strong>{label}:</strong>
        <div>{value ? formatDateTime(value, 'D.M.YYYY') : '\u00A0'}</div>
      </a>
    );
  }

  generateEditorFormValidDateFields () {
    const { selectedTOS } = this.props;
    const validFromData = this.generateEditorFormValidDateField('Voimassaolo alkaa', 'validFrom', selectedTOS.valid_from);
    const validToData = this.generateEditorFormValidDateField('Voimassaolo päättyy', 'validTo', selectedTOS.valid_to);

    return [validFromData, validToData];
  }

  generateEditorFormValidDateField (label, field, value) {
    return (
      <div key={field} className='col-xs-12 col-lg-6 form-group'>
        <label className='editor-form__label'>
          {label}
        </label>
        <DatePicker
          className='form-control edit-record__input'
          dateFormat='D.M.YYYY'
          isClearable={true}
          locale='fi-fi'
          placeholderText='PP.KK.VVVV'
          selected={value ? moment(value) : null}
          onChange={(date) => this.onValidDateChange(field, date)}
        />
      </div>
    );
  }

  onValidDateChange (key, date) {
    const value = date ? date.format('YYYY-MM-DD') : null;
    if (value) {
      this.setState({ [`${key}Editing`]: false });
    }
    this.props.editValidDates({ [key]: value });
  }

  activateValidDateEditMode (key) {
    if (this.props.selectedTOS.documentState === 'edit') {
      this.setState({ [`${key}Editing`]: true });
    }
  }

  onValidationFilterChange (validationFilter) {
    this.setState({
      validationFilter
    });
  }

  generatePhases (phases, phasesOrder) {
    const phaseElements = [];
    if (phases) {
      for (const key in phases) {
        if (phases.hasOwnProperty(key)) {
          phaseElements.push(
            <Phase
              key={key}
              phaseIndex={phases[key].id}
              phase={this.props.selectedTOS.phases[key]}
              phasesOrder={phasesOrder}
              setActionVisibility={this.props.setActionVisibility}
              setPhaseAttributesVisibility={this.props.setPhaseAttributesVisibility}
              setPhaseVisibility={this.setPhaseVisibility}
              setRecordVisibility={this.props.setRecordVisibility}
              actions={this.props.selectedTOS.actions}
              actionTypes={this.props.actionTypes}
              phases={this.props.selectedTOS.phases}
              phaseTypes={this.props.phaseTypes}
              records={this.props.selectedTOS.records}
              recordTypes={this.props.recordTypes}
              documentState={this.props.selectedTOS.documentState}
              attributeTypes={this.props.attributeTypes}
              addAction={this.props.addAction}
              addRecord={this.props.addRecord}
              editAction={this.props.editAction}
              editActionAttribute={this.props.editActionAttribute}
              editPhase={this.props.editPhase}
              editPhaseAttribute={this.props.editPhaseAttribute}
              editRecord={this.props.editRecord}
              editRecordAttribute={this.props.editRecordAttribute}
              removeAction={this.props.removeAction}
              removePhase={this.props.removePhase}
              removeRecord={this.props.removeRecord}
              displayMessage={this.props.displayMessage}
              changeOrder={this.props.changeOrder}
              importItems={this.props.importItems}
            />
          );
        }
      }
    }
    return phaseElements;
  }

  render () {
    const {
      attributeTypes,
      classification,
      selectedTOS,
      isFetching,
      templates,
      params: { id, version },
      showValidationBar,
      setClassificationVisibility
    } = this.props;

    if (!isFetching && selectedTOS.id) {
      const phasesOrder = Object.keys(selectedTOS.phases);
      const phaseElements = this.generatePhases(
        selectedTOS.phases,
        phasesOrder
      );
      const metataDataButtons = this.generateMetaDataButtons();
      const TOSVersionData = this.generateVersionData(
        attributeTypes,
        selectedTOS.attributes
      );
      const TOSMetaData = this.generateMetaData(
        attributeTypes,
        selectedTOS.attributes
      );
      const showAll = includes(window.location.pathname, '/all');

      return (
        <div key={`${id}.${version}`}>
          <div className='col-xs-12 single-tos-container'>
            <StickyContainer>
              <Sticky className='single-tos-header-wrapper'>
                <TosHeader
                  cancelEdit={this.cancelEdit}
                  classification={classification}
                  classificationId={selectedTOS.classification}
                  changeStatus={this.changeStatus}
                  currentVersion={selectedTOS.version}
                  documentState={selectedTOS.documentState}
                  fetchTos={this.fetchTOS}
                  functionId={selectedTOS.function_id}
                  isValidationBarVisible={showValidationBar}
                  name={selectedTOS.name}
                  state={selectedTOS.state}
                  setDocumentState={state => this.setDocumentState(state)}
                  setPhasesVisibility={() => this.setTosVisibility(true, false)}
                  setTosVisibility={this.setTosVisibility}
                  setValidationVisibility={this.setValidationVisibility}
                  review={this.review}
                  saveDraft={this.saveDraft}
                  tosId={selectedTOS.id}
                  versions={selectedTOS.version_history}
                />
                {showValidationBar && (
                  <ValidationBarHeader
                    onFilterChange={this.onValidationFilterChange}
                    setValidationVisibility={this.setValidationVisibility}
                    validationFilter={this.state.validationFilter}
                  />
                )}
              </Sticky>
              <div className='single-tos-wrapper'>
                <div className={
                  classnames([
                    showValidationBar ? 'col-xs-9 validation-bar-open' : 'col-xs-12'
                  ])}
                >
                  <div className='single-tos-content'>
                    {showAll && !!classification && (
                      <ClassificationHeader
                        classification={classification}
                        isOpen={selectedTOS.is_classification_open}
                        setVisibility={setClassificationVisibility}
                      />
                    )}
                    <div className='row'>
                      <div className='col-xs-6'>
                        <h4>Version tiedot</h4>
                      </div>
                      <div className='col-xs-6'>
                        {metataDataButtons}
                      </div>
                    </div>
                    {selectedTOS.is_open && (
                      <div className='row'>
                        <div className='col-xs-12'>
                          {TOSVersionData}
                        </div>
                      </div>
                    )}
                    {selectedTOS.is_open &&
                      !this.state.editingMetaData &&
                      !this.state.complementingMetaData && (
                      <div className='row tos-metadata-header'>
                        <div className='col-xs-6'>
                          <h4>Käsittelyprosessin tiedot</h4>
                        </div>
                      </div>
                    )}
                    <div className='row tos-metadata'>
                      {this.state.editingMetaData && (
                        <EditorForm
                          onShowMore={this.onEditFormShowMoreMetaData}
                          targetId={this.props.selectedTOS.id}
                          additionalFields={this.generateEditorFormValidDateFields()}
                          attributes={this.props.selectedTOS.attributes}
                          attributeTypes={this.props.attributeTypes}
                          editMetaDataWithForm={this.editMetaDataWithForm}
                          editorConfig={{
                            type: 'function',
                            action: 'edit'
                          }}
                          closeEditorForm={this.cancelMetaDataEdit}
                          displayMessage={this.props.displayMessage}
                        />
                      )}
                      {this.state.complementingMetaData && (
                        <EditorForm
                          onShowMore={this.onEditFormShowMoreMetaData}
                          targetId={this.props.selectedTOS.id}
                          additionalFields={this.generateEditorFormValidDateFields()}
                          attributes={this.props.selectedTOS.attributes}
                          attributeTypes={this.props.attributeTypes}
                          editMetaDataWithForm={this.editMetaDataWithForm}
                          editorConfig={{
                            type: 'function',
                            action: 'complement'
                          }}
                          closeEditorForm={this.cancelMetaDataComplement}
                          displayMessage={this.props.displayMessage}
                        />
                      )}
                      {!this.state.editingMetaData &&
                        !this.state.complementingMetaData && (
                          <div className='col-xs-12'>
                            {TOSMetaData}
                          </div>
                        )}
                    </div>
                    <div className='row'>
                      <div className='col-xs-3'>
                        <h4 className='phases-title'>Vaiheet</h4>
                      </div>
                      {selectedTOS.documentState === 'edit' &&
                        !this.state.createPhaseMode && (
                        <div className='col-xs-9'>
                          <button className='btn btn-link pull-right' onClick={() => this.toggleReorderView()}>
                            Järjestä käsittelyvaiheita
                          </button>
                          <button className='btn btn-link pull-right' onClick={() => this.toggleImportView()}>
                            Tuo käsittelyvaihe
                          </button>
                          <button className='btn btn-link pull-right' onClick={() => this.addPhase()}>
                            Uusi käsittelyvaihe
                          </button>
                        </div>
                      )}
                    </div>
                    <div className='row'>
                      <div className='col-xs-12'>
                        {this.state.createPhaseMode && (
                          <AddElementInput
                            type='phase'
                            submit={this.createNewPhase}
                            typeOptions={this.generateTypeOptions(
                              this.props.phaseTypes
                            )}
                            defaultAttributes={this.generateDefaultAttributes(
                              attributeTypes,
                              'phase'
                            )}
                            newDefaultAttributes={this.state.phaseDefaultAttributes}
                            newTypeSpecifier={this.state.phaseTypeSpecifier}
                            newType={this.state.phaseType}
                            onDefaultAttributeChange={this.onPhaseDefaultAttributeChange}
                            onTypeSpecifierChange={this.onPhaseTypeSpecifierChange}
                            onTypeChange={this.onPhaseTypeChange}
                            onTypeInputChange={this.onPhaseTypeInputChange}
                            cancel={this.cancelPhaseCreation}
                            onAddFormShowMore={this.onAddFormShowMorePhase}
                            showMoreOrLess={this.state.showMore}
                          />
                        )}
                        {phaseElements}
                        {this.state.showReorderView && (
                          <Popup
                            content={
                              <ReorderView
                                target='phase'
                                toggleReorderView={() => this.toggleReorderView()}
                                keys={Object.keys(selectedTOS.phases)}
                                values={selectedTOS.phases}
                                changeOrder={this.props.changeOrder}
                                parent={null}
                                attributeTypes={this.props.attributeTypes}
                                parentName={
                                  selectedTOS.function_id + ' ' + selectedTOS.name
                                }
                              />
                            }
                            closePopup={() => this.toggleReorderView()}
                          />
                        )}
                        {this.state.showImportView && (
                          <Popup
                            content={
                              <ImportView
                                level='phase'
                                toggleImportView={() => this.toggleImportView()}
                                phases={selectedTOS.phases}
                                phasesOrder={phasesOrder}
                                actions={selectedTOS.actions}
                                records={selectedTOS.records}
                                importItems={this.props.importItems}
                                title='käsittelyvaiheita'
                                targetText={'Tos-kuvaukseen ' + selectedTOS.name}
                                itemsToImportText='käsittelyvaiheet'
                              />
                            }
                            closePopup={() => this.toggleImportView()}
                          />
                        )}
                        {this.state.showCloneView && (
                          <Popup
                            content={
                              <CloneView
                                cloneFromTemplate={(selectedMethod, id) =>
                                  this.cloneFromTemplate(selectedMethod, id)
                                }
                                setNavigationVisibility={
                                  this.props.setNavigationVisibility
                                }
                                templates={templates}
                                toggleCloneView={() => this.toggleCloneView()}
                              />
                            }
                            closePopup={() => this.toggleCloneView()}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {showValidationBar && (
                  <div className='col-xs-3 validation-bar-container'>
                    <ValidationBarContainer validationFilter={this.state.validationFilter} />
                  </div>
                )}
              </div>
            </StickyContainer>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

ViewTOS.propTypes = {
  actionTypes: PropTypes.object.isRequired,
  addAction: PropTypes.func.isRequired,
  addPhase: PropTypes.func.isRequired,
  addRecord: PropTypes.func.isRequired,
  attributeTypes: PropTypes.object.isRequired,
  changeOrder: PropTypes.func.isRequired,
  changeStatus: PropTypes.func.isRequired,
  classification: PropTypes.object,
  clearTOS: PropTypes.func.isRequired,
  cloneFromTemplate: PropTypes.func.isRequired,
  displayMessage: PropTypes.func.isRequired,
  editAction: PropTypes.func.isRequired,
  editActionAttribute: PropTypes.func.isRequired,
  editMetaData: PropTypes.func.isRequired,
  editPhase: PropTypes.func.isRequired,
  editPhaseAttribute: PropTypes.func.isRequired,
  editRecord: PropTypes.func.isRequired,
  editRecordAttribute: PropTypes.func.isRequired,
  editValidDates: PropTypes.func.isRequired,
  fetchTOS: PropTypes.func.isRequired,
  importItems: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  isUser: PropTypes.bool.isRequired,
  login: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  phaseTypes: PropTypes.object.isRequired,
  push: PropTypes.func.isRequired,
  recordTypes: PropTypes.object.isRequired,
  removeAction: PropTypes.func.isRequired,
  removePhase: PropTypes.func.isRequired,
  removeRecord: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  resetTOS: PropTypes.func.isRequired,
  route: PropTypes.object.isRequired,
  router: routerShape.isRequired,
  saveDraft: PropTypes.func.isRequired,
  selectedTOS: PropTypes.object.isRequired,
  setActionVisibility: PropTypes.func.isRequired,
  setClassificationVisibility: PropTypes.func.isRequired,
  setDocumentState: PropTypes.func.isRequired,
  setMetadataVisibility: PropTypes.func.isRequired,
  setNavigationVisibility: PropTypes.func.isRequired,
  setPhaseAttributesVisibility: PropTypes.func.isRequired,
  setPhaseVisibility: PropTypes.func.isRequired,
  setRecordVisibility: PropTypes.func.isRequired,
  setTosVisibility: PropTypes.func.isRequired,
  setValidationVisibility: PropTypes.func.isRequired,
  showValidationBar: PropTypes.bool.isRequired,
  templates: PropTypes.array.isRequired
};

export default withRouter(ViewTOS);
