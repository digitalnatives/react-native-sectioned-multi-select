/* eslint-disable */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import {
  ScrollView,
  View,
  TouchableOpacity,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Text,
  TextInput,
  UIManager,
  Platform,
  LayoutAnimation,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import get from "lodash/get";
import difference from "lodash/difference";
import reject from "lodash/reject";
import Icon from "react-native-vector-icons/MaterialIcons";

import { RowItem, RowSubItem } from './components'

const Touchable =
  Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

const styles = {
  container: {},
  selectToggle: {
    marginTop: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 4
  },
  selectToggleText: {},
  item: {},
  subItem: {},
  itemText: {
    fontSize: 17
  },
  subItemText: {
    fontSize: 15,
    paddingLeft: 8
  },
  searchBar: {
    backgroundColor: "white",
    flexDirection: "row"
  },
  center: {
    alignItems: "center",
    justifyContent: "center"
  },
  separator: {},
  subSeparator: {
    height: 0
  },
  chipContainer: {},
  chipText: {},
  chipIcon: {},
  searchTextInput: {},
  scrollView: {},
  button: {},
  confirmText: {},
  toggleIcon: {},
  selectedItem: {}
};

// let date = new Date()

const noResults = <Text>Sorry, no results</Text>;

const loading = (
  <View
    style={{ marginTop: 20, alignItems: "center", justifyContent: "center" }}
  >
    <ActivityIndicator />
  </View>
);

class SectionedMultiSelect extends PureComponent {
  static propTypes = {
    single: PropTypes.bool,
    selectedItems: PropTypes.array,
    items: PropTypes.array.isRequired,
    uniqueKey: PropTypes.string.isRequired,
    subKey: PropTypes.string,
    onSelectedItemsChange: PropTypes.func.isRequired,
    showDropDowns: PropTypes.bool,
    showChips: PropTypes.bool,
    readOnlyHeadings: PropTypes.bool,
    selectText: PropTypes.string,
    confirmText: PropTypes.string,
    styles: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    colors: PropTypes.objectOf(PropTypes.string),
    searchPlaceholderText: PropTypes.string,
    noResultsComponent: PropTypes.object,
    loadingComponent: PropTypes.object,
    subItemFontFamily: PropTypes.object,
    itemFontFamily: PropTypes.object,
    searchTextFontFamily: PropTypes.object,
    confirmFontFamily: PropTypes.object,
    showRemoveAll: PropTypes.bool,
    removeAllText: PropTypes.string,
    modalSupportedOrientations: PropTypes.arrayOf(PropTypes.string),
    modalAnimationType: PropTypes.string,
    hideSearch: PropTypes.bool,
    footerComponent: PropTypes.object,
    selectToggleIconComponent: PropTypes.object,
    searchIconComponent: PropTypes.object,
    selectedIconComponent: PropTypes.object,
    dropDownToggleIconUpComponent: PropTypes.object,
    dropDownToggleIconDownComponent: PropTypes.object,
    selectChildren: PropTypes.bool,
    highlightChildren: PropTypes.bool,
    onSelectedItemObjectsChange: PropTypes.func,
    numberOfLines: PropTypes.number
  };

  static defaultProps = {
    single: false,
    selectedItems: [],
    // items: [],
    // uniqueKey: 'id',
    // subKey: 'sub',
    // onSelectedItemsChange: () => {},
    showDropDowns: true,
    showChips: true,
    readOnlyHeadings: false,
    selectText: "Select",
    confirmText: "Confirm",
    searchPlaceholderText: "Keresés",
    noResultsComponent: noResults,
    loadingComponent: loading,
    styles: {},
    colors: {
      primary: "#3f51b5",
      success: "#4caf50",
      text: "#2e2e2e",
      subText: "#848787",
      selectToggleTextColor: "#333",
      searchPlaceholderTextColor: "#999",
      searchSelectionColor: "rgba(0,0,0,0.2)",
      chipColor: "#000000",
      itemBackground: "#fff",
      subItemBackground: "#ffffff",
      disabled: "#d7d7d7"
    },
    itemFontFamily: {
      fontWeight: "bold"
    },
    subItemFontFamily: {
      fontWeight: "200"
    },
    searchTextFontFamily: {
      fontWeight: "200"
    },
    confirmFontFamily: {
      fontWeight: "bold"
    },
    removeAllText: "Remove all",
    showRemoveAll: false,
    modalSupportedOrientations: ["portrait", "landscape"],
    modalAnimationType: "fade",
    hideSearch: false,
    selectChildren: false,
    highlightChildren: false,
    numberOfLines: null
  };

  constructor(props) {
    super(props);

    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    this.state = {
      selector: false,
      searchTerm: "",
      showSubCategories: [],
      highlightedChildren: []
    };
    this.styles = StyleSheet.flatten([styles, props.styles]);
  }

  // componentWillUpdate() { date = new Date();}
  // componentDidUpdate() {console.log(new Date().valueOf() - date.valueOf())}

  find = (id, items) => {
    if (!items) {
      return {};
    }
    const { uniqueKey, subKey } = this.props;
    let i = 0;
    let found;
    for (; i < items.length; i += 1) {
      if (items[i][uniqueKey] === id) {
        return items[i];
      } else if (Array.isArray(items[i][subKey])) {
        found = this.find(id, items[i][subKey]);
        if (found) {
          return found;
        }
      }
    }
  };

  reduceSelected = (array, toSplice) => {
    const { uniqueKey } = this.props;
    array.reduce((prev, curr) => {
      toSplice.includes(curr[uniqueKey]) &&
        toSplice.splice(toSplice.findIndex(el => el === curr[uniqueKey]), 1);
    }, {});
    return toSplice;
  };

  _getSelectLabel = () => {
    const { selectText, single, selectedItems } = this.props;
    console.log("ezkell", selectedItems);
    if (!selectedItems || selectedItems.length === 0) {
      return selectText;
    } else if (single || selectedItems.length === 1) {
      const item = selectedItems[0];
      const foundItem = this._findItem(item);
      return get(foundItem, "name") || selectText;
    }
    return `${selectText} (${selectedItems.length} selected)`;
  };

  _filterItems = searchTerm => {
    const { availableActivities } = this.props;

    let filteredItems = [];
    let firstFilteredItems = [];

    if (availableActivities) {
      availableActivities.forEach(sub => {
        if ( filteredItems.indexOf(sub) === -1 ) {
          if ( (get(sub, "name").toLowerCase().indexOf(searchTerm.toLowerCase()) ) === 0 ) {
            firstFilteredItems.push(sub);
          } else if ((get(sub, "name").toLowerCase().indexOf(searchTerm.toLowerCase()) ) > 0 ) {
            filteredItems.push(sub);
          }
        }
      });
    }
    const finalFiltered = firstFilteredItems.sort((a, b) => a.name < b.name ? -1 : 1 ).concat(filteredItems.sort((a, b) => a.name < b.name ? -1 : 1 ));
    return finalFiltered;
  };

  _removeItem = item => {
    const {
      uniqueKey,
      selectedItems,
      onSelectedItemsChange,
      highlightChildren,
      onSelectedItemObjectsChange,
      selectedActivities
    } = this.props;

    removableItem = item.length > 0 ? item[0] : item;

    const newItems = reject(
      selectedItems,
      singleItem => removableItem[uniqueKey] === singleItem
    );

    highlightChildren && this._unHighlightChildren(removableItem[uniqueKey]);
    onSelectedItemObjectsChange && this._broadcastItemObjects(newItems);

    // broadcast new selected items state to parent component
    onSelectedItemsChange(newItems);
  };

  _removeAllItems = () => {
    const { onSelectedItemsChange, onSelectedItemObjectsChange } = this.props;
    // broadcast new selected items state to parent component
    onSelectedItemsChange([]);
    this.setState({ highlightedChildren: [] });
    onSelectedItemObjectsChange && this._broadcastItemObjects([]);
  };

  _removeItemOnBackspace = (event, text, items) => {
    const { selectedItems, runningInsurance } = this.props;
    const lastSelectedItemId = selectedItems.slice(-1)[0];
    const checkRunningInsurance = runningInsurance ? runningInsurance : "";

    const selectedItem = items
      .map(item =>
        item.activities.filter(
          sport => sport.id === lastSelectedItemId
        )
      )
      .filter(item => item.length);

    if (
      event.nativeEvent.key === "Backspace" &&
      selectedItem.length &&
      !text.length &&
      lastSelectedItemId !== checkRunningInsurance.activity_id
    ) {
      const lastSelectedItem = selectedItem[0][0];
      this._removeItem(lastSelectedItem);
    }
  };

  _toggleSelector = () => {
    this.setState({
      selector: !this.state.selector
    });
  };

  _submitSelection = () => {
    this._toggleSelector();
    // reset searchTerm
    this.setState({ searchTerm: "" });
  };

  _itemSelected = item => {
    const { uniqueKey, selectedItems } = this.props;
    return selectedItems.includes(item[uniqueKey]);
  };

  _toggleItem = (item, hasChildren) => {
    const {
      single,
      uniqueKey,
      selectedItems,
      onSelectedItemsChange,
      selectChildren,
      highlightChildren,
      onSelectedItemObjectsChange
    } = this.props;

    if (single) {
      this._submitSelection();
      onSelectedItemsChange([item[uniqueKey]]);
      onSelectedItemObjectsChange &&
        this._broadcastItemObjects([item[uniqueKey]]);
    } else {
      const selected = this._itemSelected(item);
      let newItems = [];
      if (selected) {
        if (hasChildren) {
          if (selectChildren) {
            newItems = [...this._rejectChildren(item[uniqueKey])];

            newItems = reject(
              newItems,
              singleItem => item[uniqueKey] === singleItem
            );
          } else if (highlightChildren) {
            this._unHighlightChildren(item[uniqueKey]);
            newItems = reject(
              selectedItems,
              singleItem => item[uniqueKey] === singleItem
            );
          } else {
            newItems = reject(
              selectedItems,
              singleItem => item[uniqueKey] === singleItem
            );
          }
        } else {
          newItems = reject(
            selectedItems,
            singleItem => item[uniqueKey] === singleItem
          );
        }
      } else {
        newItems = [...selectedItems, item[uniqueKey]];

        if (hasChildren) {
          if (selectChildren) {
            newItems = [...newItems, ...this._selectChildren(item[uniqueKey])];
          } else if (highlightChildren) {
            this._highlightChildren(item[uniqueKey]);
          }
        }
      }
      // broadcast new selected items state to parent component
      onSelectedItemsChange(newItems);
      onSelectedItemObjectsChange && this._broadcastItemObjects(newItems);
      this.setState({ searchTerm: "" });
    }
  };

  _findItem = id => {
    const { items } = this.props;
    return this.find(id, items);
  };

  _highlightChildren = id => {
    const { items, uniqueKey, subKey } = this.props;
    const { highlightedChildren } = this.state;
    const highlighted = [...highlightedChildren];

    let i = 0;
    for (; i < items.length; i += 1) {
      if (items[i][uniqueKey] === id && Array.isArray(items[i][subKey])) {
        items[i][subKey].forEach(sub => {
          !highlighted.includes(sub[uniqueKey]) &&
            highlighted.push(sub[uniqueKey]);
        });
      }
    }
    this.setState({ highlightedChildren: highlighted });
  };

  _unHighlightChildren = id => {
    const { items, uniqueKey, subKey } = this.props;
    const { highlightedChildren } = this.state;
    const highlighted = [...highlightedChildren];

    const array = items.filter(item => item[uniqueKey] === id);

    if (!array["0"]) {
      return;
    }
    if (array["0"] && !array["0"][subKey]) {
      return;
    }

    const newHighlighted = this.reduceSelected(array["0"][subKey], highlighted);

    this.setState({ highlightedChildren: newHighlighted });
  };

  _selectChildren = id => {
    const { items, selectedItems, uniqueKey, subKey } = this.props;

    let i = 0;
    const selected = [];
    for (; i < items.length; i += 1) {
      if (items[i][uniqueKey] === id && Array.isArray(items[i][subKey])) {
        items[i][subKey].forEach(sub => {
          !selectedItems.includes(sub[uniqueKey]) &&
            selected.push(sub[uniqueKey]);
        });
      }
    }

    // so we have them in state for SubRowItem should update checks
    this._highlightChildren(id);
    return selected;
  };

  _rejectChildren = id => {
    const { items, selectedItems, uniqueKey, subKey } = this.props;
    const arrayOfChildren = items.filter(item => item[uniqueKey] === id);
    const selected = [...selectedItems];
    if (!arrayOfChildren["0"]) {
      return;
    }
    if (arrayOfChildren["0"] && !arrayOfChildren["0"][subKey]) {
      return;
    }

    const newSelected = this.reduceSelected(
      arrayOfChildren["0"][subKey],
      selected
    );

    // update state for SubRowItem component should update checks
    this._unHighlightChildren(id);
    return newSelected;
  };

  _toggleDropDown = id => {
    const items = [...this.state.showSubCategories];
    if (items.includes(id)) {
      items.splice(items.findIndex(el => el === id), 1);
    } else {
      items.push(id);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({ showSubCategories: items });
  };

  _showSubCategoryDropDown = id => {
    const { showDropDowns } = this.props;
    const { searchTerm } = this.state;
    if (searchTerm.length) {
      return true;
    }
    if (showDropDowns) {
      return this.state.showSubCategories.includes(id);
    }
    return true;
  };

  // get the items back as their full objects instead of an array of ids.
  _broadcastItemObjects = newItems => {
    const { onSelectedItemObjectsChange } = this.props;

    const fullItems = [];
    newItems.forEach(singleSelectedItem => {
      const item = this._findItem(singleSelectedItem);
      fullItems.push(item);
    });
    onSelectedItemObjectsChange(fullItems);
  };

  _displaySelectedItems = () => {
    const {
      uniqueKey,
      selectedItems,
      colors,
      selectedActivities,
      availableActivities,
      runningInsurance,
      customStyle
    } = this.props;

    const selectedActivitiesObject = selectedItems.map(selectedActivity =>
      availableActivities.filter(
        availableActivity => availableActivity.id === selectedActivity
      )
    );

    return selectedActivitiesObject.map(singleSelectedItem => {
      const item = singleSelectedItem[0]
        ? singleSelectedItem[0]
        : singleSelectedItem;
      let isRunningInsurance = false;

      if (!item || !item.name) return null;

      if (runningInsurance && item.id === runningInsurance.activity_id) {
        isRunningInsurance = true;
      }

      return (
        <View
          style={[
            {
              overflow: "hidden",
              justifyContent: "center",
              height: 34,
              flexDirection: "row",
              alignItems: "center",
              paddingLeft: 10,
              margin: 4,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              backgroundColor: "white",
              fontWeight: "bold"
            },
            customStyle.selectedActivity,
          ]}
          key={item[uniqueKey]}
        >
          <Text
            numberOfLines={1}
            style={[
              {
                color: colors.chipColor,
                fontSize: 13,
                marginRight: isRunningInsurance ? 10 : 0
              },
              this.styles.chipText,
              customStyle.selectedActivity,
            ]}
          >
            {item.name}
          </Text>

          {!isRunningInsurance && (
            <TouchableOpacity
              onPress={() => {
                this._removeItem(singleSelectedItem);
              }}
              style={{
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20
              }}
            >
              <Icon
                name="close"
                style={[
                  {
                    color: colors.chipColor,
                    fontSize: 16,
                    marginHorizontal: 6,
                    marginVertical: 7
                  },
                  customStyle.iconDelete
                ]}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    });
  };

  _renderSeparator = sub => (
    <View
      style={[
        {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          alignSelf: "stretch",
          backgroundColor: "white"
        },
        sub ? this.styles.subSeparator : this.styles.separator
      ]}
    />
  );

  _renderFooter = () => {
    const { footerComponent } = this.props;
    return <View>{footerComponent && footerComponent}</View>;
  };

  _renderItemFlatList = ({ item }) => {
    const {
      selectedItems,
      uniqueKey,
      subKey,
      showDropDowns,
      colors,
      readOnlyHeadings,
      itemFontFamily,
      subItemFontFamily,
      selectedIconComponent,
      highlightChildren,
      dropDownToggleIconUpComponent,
      dropDownToggleIconDownComponent,
      numberOfLines,
      runningInsurance,
      customStyle,
    } = this.props;

    return (
      <View>
        <RowItem
          item={item}
          _showSubCategoryDropDown={this._showSubCategoryDropDown}
          _toggleDropDown={this._toggleDropDown}
          _toggleItem={this._toggleItem}
          _itemSelected={this._itemSelected}
          showSubCategories={this.state.showSubCategories}
          selectedItems={selectedItems}
          uniqueKey={uniqueKey}
          subKey={subKey}
          showDropDowns={showDropDowns}
          colors={colors}
          styles={this.styles}
          readOnlyHeadings={readOnlyHeadings}
          itemFontFamily={itemFontFamily}
          subItemFontFamily={subItemFontFamily}
          selectedIconComponent={selectedIconComponent}
          highlightChildren={highlightChildren}
          dropDownToggleIconUpComponent={dropDownToggleIconUpComponent}
          dropDownToggleIconDownComponent={dropDownToggleIconDownComponent}
          numberOfLines={numberOfLines}
          customStyle={customStyle}
        />
        {this._showSubCategoryDropDown(item[uniqueKey]) && (
          <View>
            {item[subKey] && (
              <FlatList
                keyExtractor={i => i[uniqueKey]}
                data={item[subKey]}
                extraData={selectedItems}
                ItemSeparatorComponent={() => this._renderSeparator(true)}
                renderItem={this._renderSubItemFlatList}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  _renderSubItemFlatList = ({ item }) => {
    const {
      selectedItems,
      uniqueKey,
      subKey,
      showDropDowns,
      colors,
      readOnlyHeadings,
      itemFontFamily,
      subItemFontFamily,
      selectedIconComponent,
      highlightChildren,
      selectChildren,
      dropDownToggleIconUpComponent,
      dropDownToggleIconDownComponent,
      numberOfLines,
      runningInsurance,
      customStyle,
    } = this.props;

    return (
      <RowSubItem
        item={item}
        runningInsurance={runningInsurance}
        _showSubCategoryDropDown={this._showSubCategoryDropDown}
        _toggleDropDown={this._toggleDropDown}
        _toggleItem={this._toggleItem}
        _itemSelected={this._itemSelected}
        selectChildren={selectChildren}
        highlightChildren={highlightChildren}
        highlightedChildren={this.state.highlightedChildren}
        showSubCategories={this.state.showSubCategories}
        selectedItems={selectedItems}
        uniqueKey={uniqueKey}
        subKey={subKey}
        showDropDowns={showDropDowns}
        colors={colors}
        styles={this.styles}
        readOnlyHeadings={readOnlyHeadings}
        itemFontFamily={itemFontFamily}
        subItemFontFamily={subItemFontFamily}
        selectedIconComponent={selectedIconComponent}
        dropDownToggleIconUpComponent={dropDownToggleIconUpComponent}
        dropDownToggleIconDownComponent={dropDownToggleIconDownComponent}
        numberOfLines={numberOfLines}
        customStyle={customStyle}

      />
    );
  };

  render() {
    const {
      items,
      selectedItems,
      uniqueKey,
      subKey,
      confirmText,
      searchPlaceholderText,
      noResultsComponent,
      loadingComponent,
      searchTextFontFamily,
      confirmFontFamily,
      colors,
      single,
      showChips,
      removeAllText,
      showRemoveAll,
      modalAnimationType,
      modalSupportedOrientations,
      hideSearch,
      selectToggleIconComponent,
      searchIconComponent,
      customStyle,
    } = this.props;

    const { searchTerm, selector } = this.state;
    const confirmFont = confirmFontFamily.fontFamily && confirmFontFamily;
    const searchTextFont =
      searchTextFontFamily.fontFamily && searchTextFontFamily;

    return (
      <View style={{backgroundColor: "white"}}>
        <View>
          <View
            style={{
              flexWrap: "wrap",
              justifyContent: "flex-start",
              flexDirection: "row",
              backgroundColor: "white",
            }}
          >
            <View
              style={{
                flex: 1,
                flexWrap: "wrap",
                justifyContent: "flex-start",
                flexDirection: "row",
                paddingLeft: 10,
                margin: 3,
                paddingTop: 0,
                paddingRight: 10,
                paddingBottom: 0
              }}
            >
              {this._displaySelectedItems()}
              <TextInput
                autoFocus={true}
                onKeyPress={event => {
                  this._removeItemOnBackspace(event, searchTerm, items);
                }}
                value={searchTerm}
                onChangeText={searchTerm => this.setState({ searchTerm })}
                placeholder={searchPlaceholderText}
                selectTextOnFocus
                underlineColorAndroid="transparent"
                placeholderTextColor="#666666"
                style={[
                  {
                    flex: 1,
                    fontSize: 17,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    flexWrap: "wrap",
                    minWidth: 100,
                    height: 38,
                  },
                  customStyle.searchInput,
                ]}
              />
            </View>
          </View>
          <View
            style={[
              {
                overflow: "hidden",
                marginHorizontal: 18,
                marginVertical: 26,
                borderRadius: 3,
                alignSelf: "stretch",
                flex: 1,
                backgroundColor: "white",
              },
              this.styles.container
            ]}
          >
            <ScrollView
              style={[
                {  flex: 1 },
                this.styles.scrollView,
                customStyle.activityList,
              ]}
            >
              {items && items.length ? (
                <View>
                  <View style={searchTerm !== '' && { width: 0, height: 0 }}>
                    <FlatList
                      removeClippedSubviews
                      initialNumToRender={15}
                      data={items}
                      extraData={selectedItems}
                      keyExtractor={item => item[uniqueKey]}
                      ItemSeparatorComponent={() =>
                        this._renderSeparator(false)
                      }
                      ListFooterComponent={this._renderFooter}
                      renderItem={this._renderItemFlatList}
                    />
                  </View>
                  <View style={searchTerm === '' && { width: 0, height: 0 }}>
                    <FlatList
                      data={this._filterItems(searchTerm.trim())}
                      keyExtractor={item => item[uniqueKey]}
                      extraData={selectedItems}
                      renderItem={this._renderSubItemFlatList}
                    />
                  </View>
                </View>
              ) : (
                <View>{loadingComponent}</View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }
}

export default SectionedMultiSelect;
/* eslint-enable */
