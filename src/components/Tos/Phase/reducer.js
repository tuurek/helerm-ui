import update from 'immutability-helper';
import { createAction } from 'redux-actions';

import { randomActionId } from '../../../utils/helpers';

export const ADD_PHASE = 'addPhaseAction';
export const EDIT_PHASE = 'editPhaseAction';
export const EDIT_PHASE_ATTRIBUTE = 'editPhaseAttributeAction';
export const REMOVE_PHASE = 'removePhaseAction';
export const SET_PHASE_ATTRIBUTES_VISIBILITY = 'setPhaseAttributesVisibilityAction';
export const SET_PHASE_VISIBILITY = 'setPhaseVisibilityAction';
export const SET_PHASES_VISIBILITY = 'setPhasesVisibilityAction';

export function addPhase(typeSpecifier, phaseType, phaseAttributes, parent) {
  const phaseId = randomActionId();
  const attributes = {

    TypeSpecifier: typeSpecifier, PhaseType: phaseType,
    ...phaseAttributes
  };
  const newPhase = {
    id: phaseId,
    function: parent,
    actions: [],
    attributes,
    is_attributes_open: false,
    is_open: false
  };

  return createAction(ADD_PHASE)(newPhase);
}

export function editPhase(attributes, phaseId) {
  const editedAttributes = {};

  Object.keys(attributes).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(attributes, key) && attributes[key].checked) {
      editedAttributes[key] = attributes[key].value;
    }
  });

  const editedPhase = { attributes: editedAttributes };

  return createAction(EDIT_PHASE)({ editedPhase, phaseId });
}

export function editPhaseAttribute(editedPhaseAttribute) {
  return createAction(EDIT_PHASE_ATTRIBUTE)(editedPhaseAttribute);
}

export function removePhase(phaseToRemove) {
  return createAction(REMOVE_PHASE)(phaseToRemove);
}

export function setPhaseAttributesVisibility(phase, visibility) {
  return createAction(SET_PHASE_ATTRIBUTES_VISIBILITY)({ phase, visibility });
}

export function setPhaseVisibility(phase, visibility) {
  return createAction(SET_PHASE_VISIBILITY)({ phase, visibility });
}

export function setPhasesVisibility(phases, value) {
  const allPhasesOpen = {};

  Object.keys(phases).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(phases, key)) {
      allPhasesOpen[key] = update(phases[key], {
        is_open: {
          $set: value
        }
      });
    }
  })

  return createAction(SET_PHASES_VISIBILITY)(allPhasesOpen);
}

export const addPhaseAction = (state, { payload }) => update(state, {
  phases: {
    [payload.id]: {
      $set: payload
    }
  }
});

export const editPhaseAction = (state, { payload }) => update(state, {
  phases: {
    [payload.phaseId]: {
      attributes: {
        $set: payload.editedPhase.attributes
      }
    }
  }
});

export const editPhaseAttributeAction = (state, { payload }) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'typeSpecifier')) {
    return update(state, {
      phases: {
        [payload.phaseId]: {
          attributes: {
            TypeSpecifier: {
              $set: payload.typeSpecifier
            }
          }
        }
      }
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    return update(state, {
      phases: {
        [payload.phaseId]: {
          attributes: {
            PhaseType: {
              $set: payload.type
            }
          }
        }
      }
    });
  }

  return update(state, {
    phases: {
      [payload.phaseId]: {
        attributes: {
          [payload.attributeIndex]: {
            $set: payload.attribute
          }
        }
      }
    }
  });

};

export const removePhaseAction = (state, { payload }) => {
  const phasesCopy = { ...state.phases };
  delete phasesCopy[payload];

  return update(state, {
    phases: {
      $set: phasesCopy
    }
  });
};

export const setPhaseAttributesVisibilityAction = (state, { payload }) => update(state, {
  phases: {
    [payload.phase]: {
      is_attributes_open: {
        $set: payload.visibility
      }
    }
  }
});

export const setPhaseVisibilityAction = (state, { payload }) => update(state, {
  phases: {
    [payload.phase]: {
      is_open: {
        $set: payload.visibility
      }
    }
  }
});

export const setPhasesVisibilityAction = (state, { payload }) => update(state, {
  phases: {
    $set: payload
  }
});
