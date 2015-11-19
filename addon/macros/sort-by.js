import Ember from 'ember';

var computed = Ember.computed;
var get = Ember.get;
var isPresent = Ember.isPresent;

export default function sortBy(element, itemsKey, sortPropertiesKey) {
  let sortByResult = [];
  var items = itemsKey === '@this' ? element : get(element, itemsKey);
  let sortProperties = get(element, sortPropertiesKey);

  if (items === null || typeof items !== 'object') { return Ember.A(); }

  let _sortPropObservers = [];
  // TODO: Ideally we'd only do this if things have changed
  if (_sortPropObservers) {
    _sortPropObservers.forEach(args => Ember.removeObserver.apply(null, args));
  }

  var normalizedSort = sortProperties.map(p => {
    let [prop, direction] = p.split(':');
    direction = direction || 'asc';

    return [prop, direction];
  });


  let compute = function () {
    var sortedItems = [];
    var items = get(element, itemsKey);

    if (!sortByResult.length) {
      sortedItems = items.slice().sort((itemA, itemB) => {
        for (var i = 0; i < normalizedSort.length; ++i) {
          var [prop, direction] = normalizedSort[i];
          var result = Ember.compare(get(itemA, prop), get(itemB, prop));
          if (result !== 0) {
            return (direction === 'desc') ? (-1 * result) : result;
          }
        }

        return 0;
      });
      sortByResult.pushObjects(sortedItems);
    } else {
      let diffHash = [];
      let oldItemIds = sortByResult.mapBy('id'),
        newItemIds = items.mapBy('id');

      let itemsToBeRemoved = sortByResult.reject(function (item) {
        return newItemIds.contains(item.get('id'));
      });
      let itemsToBeAdded = items.reject(function (item) {
        return oldItemIds.contains(item.get('id'));
      });
      sortByResult.removeObjects(itemsToBeRemoved);

      sortByResult.pushObjects(itemsToBeAdded);

      sortedItems = items.slice().sort((itemA, itemB) => {
        for (var i = 0; i < normalizedSort.length; ++i) {
          var [prop, direction] = normalizedSort[i];
          var result = Ember.compare(get(itemA, prop), get(itemB, prop));
          if (result !== 0) {
            return (direction === 'desc') ? (-1 * result) : result;
          }
        }

        return 0;
      });

      sortedItems.forEach(function (item, index) {
        if (index != sortByResult.indexOf(item)) {
          diffHash.pushObject({item: item, finalIndex: index, diff: Math.abs(sortByResult.indexOf(item) - index) })
        }
      });

      diffHash.sort(function (itemA, itemB) {
        let result = Ember.compare(itemA.diff, itemB.diff);
        if (result !== 0) {
          return result * -1; // desc direction
        }
        return 0;
      }).forEach(function (diff) {
        if (diff.finalIndex != sortByResult.indexOf(diff.item)) {
          sortByResult.removeObject(diff.item).insertAt(diff.finalIndex, diff.item);
        }
      });
    }
  };

  // TODO: Ideally we'd only do this if things have changed
  // Add observers
  normalizedSort.forEach(prop => {
    var args = [element, `${itemsKey}.@each.${prop[0]}`, compute];
    _sortPropObservers.push(args);
    Ember.addObserver.apply(null, args);
  });
  
  compute();
  return sortByResult;
  
}
