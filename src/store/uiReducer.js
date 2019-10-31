import update from 'immutability-helper';
import { createAction, handleActions } from 'redux-actions';
import find from 'lodash/find';

import { default as api } from '../utils/api';

const initialState = {
  isFetching: false,
  phaseTypes: {},
  actionTypes: {},
  recordTypes: {},
  attributeTypes: {},
  templates: []
};

export const RECEIVE_ATTRIBUTE_TYPES = 'receiveAttributeTypesAction';
export const RECEIVE_TEMPLATES = 'receiveTemplatesAction';
export const ERROR_FROM_API = 'errorFromApiAction';

export function receiveAttributeTypes (attributes, validationRules) {
  const attributeTypeList = {};
  attributes.results.map(result => {
    if (result.values) {
      let allowedIn = [];
      let defaultIn = [];
      let required = false;
      let requiredIn = [];
      let requiredIf = [];
      let multiIn = [];
      let allowValuesOutsideChoicesIn = [];

      // Add rules where attribute is allowed to be
      Object.keys(validationRules).forEach(rule => {
        if (validationRules.hasOwnProperty(rule) && validationRules[rule].properties[result.identifier]) {
          allowedIn.push(rule);
        }
      });

      // Add basic required if so
      validationRules.record.required.map(rule => {
        if (rule === result.identifier) {
          required = true;
        }
      });

      // Add rules where multi selection is allowed
      Object.keys(validationRules).map(key => {
        if (validationRules[key].properties[result.identifier] && validationRules[key].properties[result.identifier].anyOf) {
          const anyOfArray = find(validationRules[key].properties[result.identifier].anyOf, (anyOf) => {
            return anyOf.type === 'array';
          });
          if (anyOfArray) {
            multiIn.push(key);
          }
        }
      });

      // Add requiredIn attributes
      Object.keys(validationRules).map(key => {
        validationRules[key].required && validationRules[key].required.map(rule => {
          if (rule === result.identifier) {
            requiredIn.push(key);
          }
        });
      });

      // Add defaultIn attributes
      // hard coded now, todo: replace with backend definition
      Object.keys(validationRules).map(key => {
        if (result.identifier === 'InformationSystem') {
          defaultIn.push(key);
        }
      });

      // Add conditional rules if any
      Object.keys(validationRules).map(key => {
        validationRules[key].allOf && validationRules[key].allOf.map(oneOf => {
          Object.keys(oneOf).map(oneOfKey => {
            const rules = oneOf[oneOfKey];
            // We're only interested in required-keys
            const required = rules[0].required;

            required.map(requiredIndentifier => {
              Object.keys(rules[0].properties).map(property => {
                let values = [];
                Object.keys(rules[0].properties[property]).map(key => {
                  rules[0].properties[property][key].map(value => {
                    values.push(value);
                  });
                });

                const exists = !!find(requiredIf, (reqObj) => {
                  return reqObj.key === property;
                });

                if (requiredIndentifier === result.identifier && !exists) {
                  requiredIf.push({
                    key: property,
                    values
                  });
                }
              });
            });
          });
        });
      });

      // Add allow values outside choices rule
      Object.keys(validationRules).map(key => {
        validationRules[key].extra_validations &&
        validationRules[key].extra_validations.allow_values_outside_choices &&
        validationRules[key].extra_validations.allow_values_outside_choices.map(field => {
          if (field === result.identifier) {
            allowValuesOutsideChoicesIn.push(key);
          }
        });
      });

      attributeTypeList[result.identifier] = {
        index: result.index,
        name: result.name,
        values: result.values,
        allowedIn,
        defaultIn,
        multiIn,
        requiredIf,
        requiredIn,
        required,
        allowValuesOutsideChoicesIn
      };
    }
  });

  return createAction(RECEIVE_ATTRIBUTE_TYPES)(attributeTypeList);
}

export function receiveTemplates ({ results }) {
  const onlyIdAndName = results.map(item => ({ id: item.id, name: item.name }));
  return createAction(RECEIVE_TEMPLATES)(onlyIdAndName);
}

export function fetchAttributeTypes () {
  return function (dispatch) {
    dispatch(createAction('requestFromApiAction')());
    return api.get('attribute/schemas')
      .then(response => response.json())
      .then(validationRules => {
        return api.get('attribute', { page_size: 999 })
          .then(response => response.json())
          .then(json =>
            dispatch(receiveAttributeTypes(json, validationRules)));
      })
      .catch(() => dispatch(createAction(ERROR_FROM_API)()));
  };
}

export function fetchTemplates () {
  return function (dispatch) {
    dispatch(createAction('requestFromApiAction')());
    return api.get('template')
      .then(response => response.json())
      .then(res => {
        dispatch(receiveTemplates(res));
      })
      .catch(() => dispatch(createAction(ERROR_FROM_API)()));
  };
}

const requestFromApiAction = (state) => {
  return update(state, {
    isFetching: { $set: true }
  });
};

const receiveAttributeTypesAction = (state, { payload }) => {
  const phaseTypes = payload.PhaseType;
  const actionTypes = payload.ActionType;
  const recordTypes = payload.RecordType;
  const phaseTypeList = {};
  const actionTypeList = {};
  const recordTypeList = {};

  const trimList = (types, list) => {
    types.values.map(result => {
      const trimmedResult = result.id.replace(/-/g, '');
      list[trimmedResult] = {
        id: result.id,
        value: result.value
      };
    });
  };
  trimList(phaseTypes, phaseTypeList);
  trimList(actionTypes, actionTypeList);
  trimList(recordTypes, recordTypeList);

  return update(state, {
    attributeTypes: { $set: payload },
    phaseTypes: { $set: phaseTypeList },
    actionTypes: { $set: actionTypeList },
    recordTypes: { $set: recordTypeList },
    isFetching: { $set: false }
  });
};

const receiveTemplatesAction = (state, { payload }) => {
  return update(state, {
    templates: {
      $set: payload
    },
    isFetching: { $set: false }
  });
};

const errorFromApiAction = (state) => {
  return update(state, {
    isFetching: { $set: false }
  });
};

export default handleActions({
  requestFromApiAction,
  receiveAttributeTypesAction,
  receiveTemplatesAction,
  errorFromApiAction
}, initialState);
