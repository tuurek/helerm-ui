import React from 'react';
import classnames from 'classnames';
import Attribute from './Attribute';

export const Attributes = ({
  attributeTypes,
  element,
  documentState,
  renderBasicAttributes,
  renderButtons,
  showAttributes,
  type,
  typeOptions,
  updateAttribute,
  updateTypeSpecifier,
  updateType
}) => {
  function generateDescriptions (element) {
    const descriptions = [];
    let elementDescription;
    let elementType;

    switch (type) {
      case 'phase':
        elementDescription = 'Käsittelyvaihetyypin';
        elementType = 'PhaseType';
        break;
      case 'action':
        elementDescription = 'Toimenpidetyypin';
        elementType = 'ActionType';
        break;
      case 'record':
        elementDescription = 'Asiakirjatyypin';
        elementType = 'RecordType';
        break;
    }

    descriptions.push({
      descriptionKey: `${elementDescription} tarkenne`,
      typeSpecifier: element.attributes.TypeSpecifier,
      type: ''
    });
    descriptions.push({
      descriptionKey: 'Tyyppi',
      typeSpecifier: element.attributes[`${elementType}`],
      type: element.attributes[`${elementType}`]
    });

    return descriptions;
  }

  function generateBasicAttributes (descriptions) {
    return descriptions.map((description, index) => {
      return (
        <Attribute
          key={index}
          elementId={element.id}
          attributeIndex={description.type}
          attributeKey=''
          attribute={description.typeSpecifier}
          documentState={documentState}
          typeOptions={typeOptions}
          type={'basic'}
          editable={true}
          updateTypeSpecifier={updateTypeSpecifier}
          updateType={updateType}
          updateAttribute={updateAttribute}
          showAttributes={true}
        />
      );
    });
  }

  function generateAttributes (attributes) {
    const attributeElements = [];

    for (const key in attributeTypes) {
      if (attributes.hasOwnProperty(key) && attributes[key] && attributeTypes[key]) {
        attributeElements.push(
          <Attribute
            key={key}
            elementId={element.id}
            attributeIndex={key}
            attributeKey={attributeTypes[key].name}
            attribute={attributes[key]}
            attributeTypes={attributeTypes}
            documentState={documentState}
            type={'attribute'}
            editable={true}
            updateAttribute={updateAttribute}
            showAttributes={showAttributes}
          />);
      }
    }
    return attributeElements;
  }

  const buttons = renderButtons ? renderButtons() : null;
  const basicAttributes = renderBasicAttributes
    ? renderBasicAttributes()
    : generateBasicAttributes(generateDescriptions(element));
  const attributes = generateAttributes(element.attributes);

  return (
    <div className={classnames('list-group', `${type}-attributes`)}>
      { basicAttributes }
      { buttons }
      { attributes }
    </div>
  );
};

Attributes.propTypes = {
  attributeTypes: React.PropTypes.object.isRequired,
  documentState: React.PropTypes.string.isRequired,
  element: React.PropTypes.object.isRequired,
  renderBasicAttributes: React.PropTypes.func,
  renderButtons: React.PropTypes.func,
  showAttributes: React.PropTypes.bool.isRequired,
  type: React.PropTypes.string.isRequired,
  typeOptions: React.PropTypes.object,
  updateAttribute: React.PropTypes.func,
  updateType: React.PropTypes.func,
  updateTypeSpecifier: React.PropTypes.func
};

export default Attributes;