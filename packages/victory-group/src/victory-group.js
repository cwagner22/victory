import { assign, defaults, isEmpty } from "lodash";
import PropTypes from "prop-types";
import React from "react";
import {
  Helpers,
  VictoryContainer,
  VictoryTheme,
  CommonProps,
  Wrapper,
  usePreviousProps,
  useAnimationState
} from "victory-core";
import { VictorySharedEvents } from "victory-shared-events";
import { getChildren, getCalculatedProps } from "./helper-methods";
import isEqual from "react-fast-compare";

const fallbackProps = {
  width: 450,
  height: 300,
  padding: 50,
  offset: 0
};

const BaseVictoryGroup = (p) => {
  // eslint-disable-next-line no-use-before-define
  const { role } = VictoryGroup;
  const { getAnimationProps, state, setState, setAnimationState } =
    useAnimationState();
  const props = state && state.nodesWillExit ? state.oldProps || p : p;

  const modifiedProps = Helpers.modifyProps(props, fallbackProps, role);
  const {
    eventKey,
    containerComponent,
    standalone,
    groupComponent,
    externalEventMutations,
    width,
    height,
    theme,
    polar,
    horizontal,
    name
  } = modifiedProps;

  const childComponents = React.Children.toArray(modifiedProps.children);
  const calculatedProps = getCalculatedProps(modifiedProps, childComponents);
  const { domain, scale, style, origin } = calculatedProps;

  const newChildren = React.useMemo(() => {
    const children = getChildren(props, childComponents, calculatedProps);
    return children.map((child, index) => {
      const childProps = assign(
        { animate: getAnimationProps(props, child, index) },
        child.props
      );
      return React.cloneElement(child, childProps);
    });
  }, [props, childComponents, calculatedProps, getAnimationProps]);

  const containerProps = React.useMemo(() => {
    if (standalone) {
      return {
        domain,
        scale,
        width,
        height,
        standalone,
        theme,
        style: style.parent,
        horizontal,
        polar,
        origin,
        name
      };
    }
    return {};
  }, [
    standalone,
    domain,
    scale,
    width,
    height,
    theme,
    style,
    horizontal,
    polar,
    origin,
    name
  ]);

  const container = React.useMemo(() => {
    if (standalone) {
      const defaultContainerProps = defaults(
        {},
        containerComponent.props,
        containerProps
      );
      return React.cloneElement(containerComponent, defaultContainerProps);
    }
    return groupComponent;
  }, [groupComponent, standalone, containerComponent, containerProps]);

  const events = React.useMemo(() => {
    return Wrapper.getAllEvents(props);
  }, [props]);

  const previousProps = usePreviousProps();

  React.useEffect(() => {
    if (props.animate) {
      setState({
        nodesShouldLoad: false,
        nodesDoneLoad: false,
        animating: true
      });
    }
    // This hook will run once when the component is initialized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.animate) {
      setAnimationState(previousProps, props);
    }
  }, [setAnimationState, previousProps, props]);

  if (!isEmpty(events)) {
    return (
      <VictorySharedEvents
        container={container}
        eventKey={eventKey}
        events={events}
        externalEventMutations={externalEventMutations}
      >
        {newChildren}
      </VictorySharedEvents>
    );
  }
  return React.cloneElement(container, container.props, newChildren);
};

// We need to attatch the static properties to the memoized version, or else
// VictoryChart will not be able to get this component's role type
const VictoryGroup = React.memo(BaseVictoryGroup, isEqual);

VictoryGroup.displayName = "VictoryGroup";
VictoryGroup.role = "group";
VictoryGroup.propTypes = {
  ...CommonProps.baseProps,
  ...CommonProps.dataProps,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  colorScale: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.oneOf([
      "grayscale",
      "qualitative",
      "heatmap",
      "warm",
      "cool",
      "red",
      "green",
      "blue"
    ])
  ]),
  horizontal: PropTypes.bool,
  offset: PropTypes.number
};

VictoryGroup.defaultProps = {
  containerComponent: <VictoryContainer />,
  groupComponent: <g />,
  samples: 50,
  sortOrder: "ascending",
  standalone: true,
  theme: VictoryTheme.grayscale
};

VictoryGroup.expectedComponents = [
  "groupComponent",
  "containerComponent",
  "labelComponent"
];

VictoryGroup.getChildren = getChildren;

export default VictoryGroup;
