/* eslint-disable */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, TouchableOpacity, Text } from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";

class RowItem extends Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.selectedItems !== this.props.selectedItems) {
      if (
        this.props.selectedItems.includes(
          this.props.item[this.props.uniqueKey]
        ) &&
        !nextProps.selectedItems.includes(this.props.item[this.props.uniqueKey])
      ) {
        return true;
      }
      if (
        !this.props.selectedItems.includes(
          this.props.item[this.props.uniqueKey]
        ) &&
        nextProps.selectedItems.includes(this.props.item[this.props.uniqueKey])
      ) {
        return true;
      }
    }

    return false;
  }

  _itemSelected = item => {
    const { uniqueKey, selectedItems } = this.props;
    return selectedItems.includes(item[uniqueKey]);
  };

  _toggleItem = (item, hasChildren) => {
    this.props._toggleItem(item, hasChildren);
  };

  _toggleDropDown = (item, parent) => {
    this.props._toggleDropDown(item, parent);
    this.forceUpdate();
  };

  _showSubCategoryDropDown = id => {
    this.props._showSubCategoryDropDown(id);
  };

  _dropDownOrToggle = (item, parent) => {
    const { readOnlyHeadings, showDropDowns, uniqueKey, subKey } = this.props;

    const hasChildren = item[subKey] && item[subKey].length ? true : false;

    if (readOnlyHeadings && item[subKey] && showDropDowns) {
      this._toggleDropDown(item[uniqueKey]);
    } else if (readOnlyHeadings && parent) {
      return;
    } else {
      this._toggleItem(item, hasChildren);
    }
  };

  render() {
    const {
      item,
      styles,
      selectedItems,
      uniqueKey,
      subKey,
      showDropDowns,
      colors,
      readOnlyHeadings,
      itemFontFamily,
      selectedIconComponent,
      highlightChildren,
      dropDownToggleIconUpComponent,
      dropDownToggleIconDownComponent,
      showSubCategories,
      numberOfLines,
      runningInsurance,
      customStyle,
    } = this.props;

    const hasDropDown =
      item[subKey] && item[subKey].length > 0 && showDropDowns;

    return (
      <View
        key={item[uniqueKey]}
        style={{
          flexDirection: "row",
          flex: 1,
          backgroundColor: colors.itemBackground
        }}
      >
        <TouchableOpacity
          disabled={(readOnlyHeadings && !showDropDowns) || item.disabled}
          onPress={() => this._dropDownOrToggle(item, true)}
          style={[
            {
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingVertical: 10
            },
            styles.item,
            this._itemSelected(item) && styles.selectedItem,
            customStyle.rowItem
          ]}
        >
          <Text
            numberOfLines={numberOfLines}
            style={[{ flex: 1, color: colors.text, fontSize: 18 }, customStyle.rowItem]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
        {hasDropDown && (
          <TouchableOpacity
            style={[
              {
                alignItems: "flex-end",
                justifyContent: "center",
                paddingHorizontal: 10,
                backgroundColor: "transparent"
              },
              customStyle.downArrowContainer
            ]}
            onPress={() => {
              this._toggleDropDown(item[uniqueKey]);
            }}
          >
            {this._showSubCategoryDropDown(item[uniqueKey]) ? (
              <View>
                {dropDownToggleIconUpComponent ? (
                  dropDownToggleIconUpComponent
                ) : (
                  <Icon
                    name="keyboard-arrow-up"
                    size={22}
                    style={customStyle.downArrow}
                  />
                )}
              </View>
            ) : (
              <View>
                {dropDownToggleIconDownComponent ? (
                  dropDownToggleIconDownComponent
                ) : (
                  <Icon
                    name="keyboard-arrow-down"
                    size={34}
                    style={customStyle.downArrow}
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

export default RowItem;
/* eslint-enable */
