import update from 'immutability-helper';
import { createAction } from 'redux-actions';

export const ADD_PHASE = 'addPhaseAction';
export const EDIT_PHASE = 'editPhaseAction';
export const REMOVE_PHASE = 'removePhaseAction';
export const SET_PHASE_VISIBILITY = 'setPhaseVisibilityAction';
export const SET_PHASES_VISIBILITY = 'setPhasesVisibilityAction';

export function addPhase (name, parent) {
  const phaseId = Math.random().toString(36).replace(/[^a-z]+/g, '');
  const newPhase = {
    name: name,
    id: phaseId,
    function: parent,
    actions: [],
    attributes: {},
    is_open: false
  };

  return createAction(ADD_PHASE)(newPhase);
}

export function editPhase (editedPhase) {
  return createAction(EDIT_PHASE)(editedPhase);
}

export function removePhase (phaseToRemove) {
  return createAction(REMOVE_PHASE)(phaseToRemove);
}

export function setPhaseVisibility (phase, visibility) {
  return createAction(SET_PHASE_VISIBILITY)({ phase, visibility });
}

export function setPhasesVisibility (phases, value) {
  const allPhasesOpen = {};
  for (const key in phases) {
    if (phases.hasOwnProperty(key)) {
      allPhasesOpen[key] = update(phases[key], {
        is_open: {
          $set: value
        }
      });
    }
  }
  return createAction(SET_PHASES_VISIBILITY)(allPhasesOpen);
}

export const addPhaseAction = (state, { payload }) => {
  return update(state, {
    phases: {
      [payload.id]: {
        $set: payload
      }
    }
  });
};

export const editPhaseAction = (state, { payload }) => {
  return update(state, {
    phases: {
      [payload.id]: {
        name: {
          $set: payload.name
        }
      }
    }
  });
};

export const removePhaseAction = (state, { payload }) => {
  const phasesCopy = Object.assign({}, state.phases);
  delete phasesCopy[payload];

  return update(state, {
    phases: {
      $set: phasesCopy
    }
  });
};

export const setPhaseVisibilityAction = (state, { payload }) => {
  return update(state, {
    phases: {
      [payload.phase]: {
        is_open: {
          $set: payload.visibility
        }
      }
    }
  });
};

export const setPhasesVisibilityAction = (state, { payload }) => {
  return update(state, {
    phases: {
      $set: payload
    }
  });
};