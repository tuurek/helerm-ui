import React, { PropTypes } from 'react';
import Select from 'react-select';
import classnames from 'classnames';
import { filter, find, includes, isArray, isEmpty, orderBy, slice, uniq, without } from 'lodash';

import {
  FACET_ATTRIBUTE_SIZE,
  FACETED_SEARCH_DEFAULT_ATTRIBUTES,
  TYPE_ACTION,
  TYPE_CLASSIFICATION,
  TYPE_FUNCTION,
  TYPE_PHASE,
  TYPE_RECORD,
  TYPE_LABELS
} from '../../../config/constants';
import './FacetedSearch.scss';

export const EXPORT_OPTIONS = [
  { value: 0, label: 'Yhdelle välilehdelle' },
  { value: 1, label: 'Omille välilehdille' }
];

export class FacetedSearch extends React.Component {
  constructor (props) {
    super(props);

    this.onClickAttribute = this.onClickAttribute.bind(this);
    this.onClickAttributeOption = this.onClickAttributeOption.bind(this);
    this.onClickItem = this.onClickItem.bind(this);
    this.onClickShowAll = this.onClickShowAll.bind(this);
    this.onClosePreview = this.onClosePreview.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onClickReset = this.onClickReset.bind(this);
    this.onSearchClick = this.onSearchClick.bind(this);
    this.onSearchInputChange = this.onSearchInputChange.bind(this);
    this.onToggleFacet = this.onToggleFacet.bind(this);

    this.state = {
      facetsOpen: [],
      previewItem: null,
      searchTerm: '',
      selectedFacets: {
        action: [],
        classification: [],
        function: [],
        phase: [],
        record: []
      }
    };
  }

  componentDidMount () {
    this.props.setNavigationVisibility(false);
    const { attributeTypes, isFetching, items } = this.props;
    if (!isEmpty(attributeTypes) && !isFetching && isEmpty(items)) {
      this.props.fetchClassifications();
    }
  }

  componentDidUpdate () {
    const { attributeTypes, isFetching, classifications } = this.props;
    if (!isEmpty(attributeTypes) && !isFetching && isEmpty(classifications)) {
      this.props.fetchClassifications();
    }
  }

  onToggleFacet (type) {
    const { facetsOpen } = this.state;
    this.setState({
      facetsOpen: includes(facetsOpen, type)
        ? without(facetsOpen, type)
        : [...facetsOpen, type]
    });
  }

  onClickShowAll (attribute) {
    this.props.toggleShowAllAttributeOptions(attribute);
  }

  onClickAttribute (attribute) {
    this.props.toggleAttributeOpen(attribute);
  }

  onClickAttributeOption (attribute, option) {
    // this.props.toggleAttributeOption(attribute, option);
    const { key, name, type } = attribute;
    const { value, hits } = option;
    const { selectedFacets } = this.state;
    const facets = selectedFacets[type];
    if (facets) {
      const facet = find(facets, { key, value });
      this.setState({
        selectedFacets: {
          ...selectedFacets,
          [type]: facet
            ? without(facets, facet)
            : [...facets, { key, name, type, value, hits }]
        }
      }, () => {
        this.props.filterItems(this.state.selectedFacets);
      });
    }
  }

  onClickItem (item) {
    this.setState({
      previewItem: item
    });
  }

  onClickReset () {
    this.setState({
      facetsOpen: [],
      previewItem: null,
      searchTerm: '',
      selectedFacets: {
        action: [],
        classification: [],
        function: [],
        phase: [],
        record: []
      }
    }, () => {
      this.props.searchItems('');
    });
  }

  onClosePreview () {
    this.setState({
      previewItem: null
    });
  }

  onRemoveFacet (key, type, value) {
    const { selectedFacets } = this.state;
    const facets = selectedFacets[type];
    if (facets) {
      const facet = find(facets, { key, value });
      if (facet) {
        this.setState({
          selectedFacets: {
            ...selectedFacets,
            [type]: without(facets, facet)
          }
        }, () => {
          this.props.filterItems(this.state.selectedFacets);
        });
      }
    }
  }

  onSearchInputChange (e) {
    this.setState({ searchTerm: e.target.value });
  }

  onSearchClick () {
    const { searchTerm } = this.state;
    this.setState({
      selectedFacets: {
        action: [],
        classification: [],
        function: [],
        phase: [],
        record: []
      }
    }, () => {
      this.props.searchItems(searchTerm);
    });
  }

  onExport (option) {
    console.log('onExport', option.value);
  }

  isOptionSelected (attribute, option) {
    const { key, type } = attribute;
    const { value } = option;
    const facets = this.state.selectedFacets[type];
    const facetOption = find(facets, facet => facet.key === key && facet.value === value);
    return !!facetOption;
  }

  renderAttribute (attribute) {
    const orderedOptions = orderBy(attribute.options, val => val.hits.length, ['desc']);
    const options = attribute.showAll ? orderedOptions : slice(orderedOptions, 0, FACET_ATTRIBUTE_SIZE);
    const hidden = attribute.options.length - options.length;
    const total = uniq(attribute.options.reduce((acc, val) => {
      acc.push(...val.hits);
      return acc;
    }, [])).length;
    return (
      <div key={attribute.key}>
        <div
          className='faceted-search-facets-item-attribute'
          onClick={() => this.onClickAttribute(attribute)}
        >
          <i className={classnames('fa', { 'fa-minus': attribute.open, 'fa-plus': !attribute.open })} />
          <span>{attribute.name}</span>
          <span>({total})</span>
        </div>
        {attribute.open && options.map((option, index) => (
          <div
            className={classnames(
              'faceted-search-facets-item-attribute-value',
              { 'faceted-search-facets-item-attribute-value-selected': this.isOptionSelected(attribute, option) }
            )}
            key={`${attribute.type}-${attribute.key}-${option.value}-${index}`}
            onClick={() => this.onClickAttributeOption(attribute, option)}
          >
            <i className='fa fa-check' />
            <span>{isArray(option.value) ? option.value.join(', ') : option.value}</span>
            <span>({option.hits.length})</span>
          </div>
        ))}
        {attribute.open && orderedOptions.length > FACET_ATTRIBUTE_SIZE && (
          <div
            className='faceted-search-facets-item-attribute-more'
            onClick={() => this.onClickShowAll(attribute)}
          >
            {attribute.showAll ? 'Vähemmän' : `Lisää (${hidden})`}
          </div>
        )}
      </div>
    );
  }

  renderFacetGroup (type) {
    const { attributes } = this.props;
    const { facetsOpen } = this.state;
    const typeAttributes = filter(attributes, { type });
    const orderedAttributes = orderBy(typeAttributes, attr => {
      const hits = attr.options.reduce((acc, val) => {
        acc.push(...val.hits);
        return acc;
      }, []);
      return uniq(hits).length;
    }, ['desc']);
    const isOpen = includes(facetsOpen, type);
    const hits = typeAttributes.reduce((acc, attr) => {
      const h = attr.options.reduce((hitAcc, val) => {
        hitAcc.push(...val.hits);
        return hitAcc;
      }, []);
      acc.push(...h);
      return acc;
    }, []);
    const totalHits = uniq(hits).length;

    return (
      <div className='faceted-search-facets-item' key={`facet-${type}`}>
        <div
          className='faceted-search-facets-item-title'
          onClick={() => this.onToggleFacet(type)}
        >
          <span>{TYPE_LABELS[type]} ({totalHits})</span>
          <button className='btn btn-link'>
            <i className={classnames('fa', { 'fa-angle-down': !isOpen, 'fa-angle-up': isOpen })} />
          </button>
        </div>
        {isOpen && !isEmpty(orderedAttributes) && (
          <div className='faceted-search-facets-item-attributes'>
            {orderedAttributes.map(attribute => this.renderAttribute(attribute))}
          </div>
        )}
      </div>
    );
  }

  renderSelectedFacetButton (facet) {
    const { key, name, type, value } = facet;
    const valueStr = isArray(value) ? value.join(',') : value;
    const text = `${TYPE_LABELS[type]} / ${name}: ${valueStr}`;
    return (
      <button
        className='btn btn-sm btn-default'
        key={`${type}-${key}-${value}`}
        onClick={() => this.onRemoveFacet(key, type, value)}
      >
        <span>{text}</span>
        <i className='fa fa-times' />
        <span className='tooltiptext'>{text}</span>
      </button>
    );
  }

  renderSelectedFacets () {
    const { selectedFacets } = this.state;
    return (
      <div className='faceted-search-selected-facets'>
        {selectedFacets.classification.map(facet => this.renderSelectedFacetButton(facet))}
        {selectedFacets.function.map(facet => this.renderSelectedFacetButton(facet))}
        {selectedFacets.phase.map(facet => this.renderSelectedFacetButton(facet))}
        {selectedFacets.action.map(facet => this.renderSelectedFacetButton(facet))}
        {selectedFacets.record.map(facet => this.renderSelectedFacetButton(facet))}
      </div>
    );
  }

  renderPreviewItem (previewItem) {
    const { attributeTypes } = this.props;
    const attributes = Object.keys(previewItem.attributes).reduce((acc, key) => {
      if (previewItem.attributes.hasOwnProperty(key) && previewItem.attributes[key]) {
        const attribute = attributeTypes[key]
          ? attributeTypes[key]
          : find(FACETED_SEARCH_DEFAULT_ATTRIBUTES, { key });
        acc.push({
          key,
          name: attribute && attribute.name ? attribute.name : key,
          value: previewItem.attributes[key]
        });
      }
      return acc;
    }, []);
    return (
      <div>
        <div className='faceted-search-preview-item-title'>
          Esikatselu
          <button className='btn btn-sm btn-link pull-right' onClick={this.onClosePreview}>
            <i className='fa fa-times' />
          </button>
        </div>
        <div className='faceted-search-preview-item-path'>
          {previewItem.path.map(path => (
            <div key={`preview-${path}`}>{path}</div>
          ))}
        </div>
        <div className='faceted-search-preview-item-type'>{TYPE_LABELS[previewItem.type]}</div>
        <div className='faceted-search-preview-item-name'>{previewItem.name}</div>
        {attributes.map(attr => (
          <div className='faceted-search-preview-item-attribute' key={`preview-${attr.key}`}>
            <div><strong>{attr.name}</strong></div>
            <div>{isArray(attr.value) ? attr.value.join(', ') : attr.value}</div>
          </div>
        ))}
      </div>
    );
  }

  render () {
    const { previewItem, searchTerm } = this.state;
    const { isFetching, items } = this.props;

    return (
      <div className='faceted-search'>
        <div className='faceted-search-content'>
          <div className='faceted-search-header'>
            <div>
              <h2>Sisältöhaku</h2>
            </div>
            <div>
              <Select
                autoBlur={false}
                clearable={false}
                value={null}
                onChange={this.onExport}
                autoFocus={true}
                options={EXPORT_OPTIONS}
                placeholder='Vie hakutulokset'
              />
            </div>
          </div>
          <div className='faceted-search-field'>
            <input className='input-title form-control col-xs-11'
              type='search'
              placeholder='Vapaasanahaku'
              onChange={this.onSearchInputChange}
              value={searchTerm}
            />
            <button className='btn btn-primary' onClick={this.onSearchClick}>Hae</button>
            <button className='btn btn-primary' onClick={this.onClickReset}>Tyhjennä</button>
            <button className='btn btn-link faceted-search-tip'>
              <i className='fa fa-question' />
            </button>
          </div>
          <div className='faceted-search-results'>
            <div className='faceted-search-facets'>
              <div className='faceted-search-facets-item faceted-search-facets-title'>
                <span>Rajaa hakua</span>
                <button className='btn btn-link'><i className='fa fa-question' /></button>
              </div>
              <div className='faceted-search-facets-items'>
                {this.renderFacetGroup(TYPE_CLASSIFICATION)}
                {this.renderFacetGroup(TYPE_FUNCTION)}
                {this.renderFacetGroup(TYPE_PHASE)}
                {this.renderFacetGroup(TYPE_ACTION)}
                {this.renderFacetGroup(TYPE_RECORD)}
              </div>
            </div>
            <div className='faceted-search-list'>
              {isFetching && <div className='faceted-search-loader'><span className='fa fa-2x fa-spinner fa-spin'/></div>}
              {this.renderSelectedFacets()}
              {items.map(item => (
                <div
                  className={classnames('faceted-search-list-item', {
                    'faceted-search-list-item-selected': previewItem && previewItem.id === item.id
                  })}
                  key={item.id}
                  onClick={() => this.onClickItem(item)}
                >
                  <div className='faceted-search-list-item-info'>
                    <div className='faceted-search-list-item-type'>{TYPE_LABELS[item.type]}</div>
                    <div className='faceted-search-list-item-title'>{item.name}</div>
                    <div className='faceted-search-list-item-path'>{item.path ? item.path.join(' > ') : ''}</div>
                  </div>
                  <div className='faceted-search-list-item-link'>
                    <i className={classnames('fa', {
                      'fa-angle-right': !previewItem || previewItem.id !== item.id,
                      'fa-angle-left': previewItem && previewItem.id === item.id
                    })} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='faceted-search-preview'>
          {!!previewItem && this.renderPreviewItem(previewItem)}
        </div>
      </div>
    );
  }
}

FacetedSearch.propTypes = {
  attributeTypes: PropTypes.object.isRequired,
  attributes: PropTypes.array.isRequired,
  classifications: PropTypes.array.isRequired,
  fetchClassifications: PropTypes.func.isRequired,
  filterItems: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  items: PropTypes.array.isRequired,
  searchItems: PropTypes.func.isRequired,
  setNavigationVisibility: PropTypes.func.isRequired,
  toggleAttributeOpen: PropTypes.func.isRequired,
  // toggleAttributeOption: PropTypes.func.isRequired,
  toggleShowAllAttributeOptions: PropTypes.func.isRequired
};

export default FacetedSearch;
