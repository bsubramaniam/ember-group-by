import Ember from 'ember';

var computed = Ember.computed;
var get = Ember.get;
var isPresent = Ember.isPresent;

function pushToGroup(groups, item, property, value) {
  var group = groups.findBy('value', value);
  if (isPresent(group)) {
    get(group, 'items').push(item);
  } else {
    group = { property: property, value: value, items: [item] };
    groups.push(group);
  }
}
export default function groupBy(element, collection, property) {
  var dependentKey = collection + '.@each.' + property;
  let groupByResult = [];

  let compute = function () {
    var groups = [];
    var items = get(element, collection);

    items.forEach(function(item) {
      var value = get(item, property);
      if (Ember.isArray(value)) {
        value.forEach(function(v) {
          pushToGroup(groups, item, property, v);
        })
      } else {
        pushToGroup(groups, item, property, value);
      }
    });
    // groupByResult.clear();
    if (!groupByResult.length) {
      groupByResult.pushObjects(groups);
    } else {
      groups.forEach(function(group) {
        if (!groupByResult.findBy('value', group.value)) {
          groupByResult.pushObject(group);
        } else {
          let items = groupByResult.findBy('value', group.value).items;

          let itemsToBeRemoved = items.reject(function (item) {
            return group.items.contains(item);
          });
          let itemsToBeAdded = group.items.reject(function (item) {
            return items.contains(item);
          });
          items.removeObjects(itemsToBeRemoved);
          items.pushObjects(itemsToBeAdded);
        }
      });
      groupByResult.removeObjects(groupByResult.filter(function(group) {
        return !groups.findBy('value', group.value);
      }));
    }
  };

  element.addObserver(dependentKey, function() {
    compute();
  });
  compute();
  return groupByResult;
}
