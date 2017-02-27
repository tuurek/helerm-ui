import LTT from 'list-to-tree';
import {
  orderBy,
  find,
  filter,
  flatten,
  map
} from 'lodash';

export function convertToTree (itemList) {
  // ------------------------------------
  // Combine navigation number and names
  // and
  // Give each item in the navigation a level specific id for sorting
  // ------------------------------------
  itemList.results.map(item => {
    item.name = item.function_id + ' ' + item.name;
    item.sort_id = item.function_id.substring(item.function_id.length - 2, item.function_id.length);
    item.path = [];
  });
  const ltt = new LTT(itemList.results, {
    key_id: 'id',
    key_parent: 'parent',
    key_child: 'children'
  });
  const unOrderedTree = ltt.GetTree();
  // ------------------------------------
  // Sort the tree, as ltt doesnt automatically do it
  // ------------------------------------
  const sortTree = tree => {
    tree = orderBy(tree, ['sort_id'], 'asc');
    return tree.map(item => {
      if (item.children !== undefined) {
        // ------------------------------------
        // Generate path to show when navigation is minimized and TOS is shown
        // ------------------------------------
        item.path.push(item.name);
        item.children.map(child => {
          item.path.map(path => child.path.push(path));
        });
        item.children = orderBy(item.children, ['sort_id'], 'asc');
        sortTree(item.children);
      }
      return item;
    });
  };
  return sortTree(unOrderedTree);
}

/**
 * Normalize tos for API
 * @param tos
 * @returns {*}
 */
export function normalizeTosForApi (tos) {
  // TODO: needs some serious refactoring...
  const phases = Object.keys(tos.phases).map(phase => tos.phases[phase]);
  phases.map(phase => phase.actions.map((action, actionIndex) => {
    delete phase.actions[actionIndex];
    phase.actions[actionIndex] = tos.actions[action];
    phase.actions[actionIndex].records.map((record, recordsIndex) => {
      delete phase.actions[actionIndex].records[recordsIndex];
      phase.actions[actionIndex].records[recordsIndex] = tos.records[record];
    });
  }));

  delete tos.actions;
  delete tos.records;
  tos.phases = phases;
  return tos;
}

/**
 * Find item by id (nested array with `children`-key)
 * @param items
 * @param id
 * @returns {*}
 */
export function itemById (items, id) {
  let searchResult = find(items, (item) => (item.id === id));

  if (!searchResult) {
    let filteredItems = filter(items, (item) => (item.children));
    let subset = flatten(map(filteredItems, (item) => (item.children)));

    if (subset.length !== 0) {
      return itemById(subset, id);
    }
    return null;
  }
  return searchResult;
}

/**
 * Centered PopUp-Window
 * @param url
 * @param title
 * @param w
 * @param h
 * @returns {Window}
 */
export function centeredPopUp (url, title, w, h) {
  const left = (screen.width / 2) - (w / 2);
  const top = (screen.height / 2) - (h / 2);
  return window.open(
    url,
    title,
    `
    toolbar=no,
    location=no,
    directories=no,
    status=no, menubar=no,
    scrollbars=no,
    resizable=no,
    copyhistory=no,
    width=${w}, height=${h}, top=${top}, left=${left}
  `);
}