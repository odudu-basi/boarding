import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ElementNode, ElementStyle, ElementAction, Analytics, ConditionalDestination, ConditionalRoutes } from '../types';
import { resolveTemplate, evaluateCondition } from '../variableUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';

const IconSets: Record<string, any> = {
  lucide: Feather,
  feather: Feather,
  material: MaterialIcons,
  'material-community': MaterialCommunityIcons,
  ionicons: Ionicons,
  fontawesome: FontAwesome,
  'sf-symbols': Ionicons,
};

interface ElementRendererProps {
  elements: ElementNode[];
  analytics?: Analytics;
  screenId?: string;
  onNavigate?: (destination: string | ConditionalDestination | ConditionalRoutes) => void;
  onDismiss?: () => void;
  variables?: Record<string, any>;
  onSetVariable?: (name: string, value: any) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  elements,
  analytics,
  screenId,
  onNavigate,
  onDismiss,
  variables = {},
  onSetVariable,
}) => {
  // Track toggled element IDs for toggle actions
  const [toggledIds, setToggledIds] = useState<Set<string>>(new Set());
  // Track selection groups: group name → selected element ID
  const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});
  // Track text input values locally (uncontrolled)
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const executeAction = useCallback(
    (action: ElementAction, element: ElementNode) => {
      // Track the action
      analytics?.track('element_action', {
        screen_id: screenId,
        element_id: element.id,
        action_type: action.type,
        destination: typeof action.destination === 'string' ? action.destination : 'conditional',
      });

      switch (action.type) {
        case 'set_variable':
          if (action.variable !== undefined && onSetVariable) {
            onSetVariable(action.variable, action.value);
          }
          // Also save all current text input values when any action is triggered
          if (onSetVariable) {
            Object.entries(inputValues).forEach(([key, value]) => {
              onSetVariable(key, value);
            });
          }
          break;
        case 'toggle': {
          const group = action.group;
          if (group) {
            // Single-select group: deselect previous, select new
            setGroupSelections((prev) => {
              const prevSelected = prev[group];
              if (prevSelected === element.id) return prev; // already selected
              return { ...prev, [group]: element.id };
            });
            setToggledIds((prev) => {
              const next = new Set(prev);
              const prevSelected = groupSelections[group];
              if (prevSelected) next.delete(prevSelected);
              next.add(element.id);
              return next;
            });
          } else {
            // Ungrouped toggle: multi-select
            setToggledIds((prev) => {
              const next = new Set(prev);
              if (next.has(element.id)) {
                next.delete(element.id);
              } else {
                next.add(element.id);
              }
              return next;
            });
          }
          break;
        }
        case 'navigate':
          // Save all text input values before navigating
          if (onSetVariable) {
            Object.entries(inputValues).forEach(([key, value]) => {
              onSetVariable(key, value);
            });
          }
          if (onNavigate && action.destination) {
            onNavigate(action.destination);
          }
          break;
        case 'link':
          if (action.destination && typeof action.destination === 'string') {
            Linking.openURL(action.destination).catch(() => {});
          }
          break;
        case 'dismiss':
          onDismiss?.();
          break;
        case 'tap':
          // Generic tap — analytics already tracked above
          break;
      }
    },
    [groupSelections, onNavigate, onDismiss, analytics, screenId, onSetVariable, inputValues]
  );

  const handleAction = useCallback(
    (element: ElementNode) => {
      // Execute single action (backward compatible)
      if (element.action) {
        executeAction(element.action, element);
      }
      // Execute all actions in the actions array
      if (element.actions) {
        for (const action of element.actions) {
          executeAction(action, element);
        }
      }
    },
    [executeAction]
  );

  if (!elements || elements.length === 0) {
    return null;
  }

  return (
    <>
      {elements.map((element) => (
        <RenderNode
          key={element.id}
          element={element}
          toggledIds={toggledIds}
          groupSelections={groupSelections}
          onAction={handleAction}
          variables={variables}
          inputValues={inputValues}
          setInputValues={setInputValues}
        />
      ))}
    </>
  );
};

// ─── Recursive Node Renderer ───

interface RenderNodeProps {
  element: ElementNode;
  toggledIds: Set<string>;
  groupSelections: Record<string, string>;
  onAction: (element: ElementNode) => void;
  variables: Record<string, any>;
  onSetVariable?: (name: string, value: any) => void;
  inputValues: Record<string, string>;
  setInputValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const RenderNode: React.FC<RenderNodeProps> = ({ element, toggledIds, groupSelections, onAction, variables, onSetVariable, inputValues, setInputValues }) => {
  // Variable-based conditions — hide element if condition is not met
  if (element.conditions?.show_if) {
    const shouldShow = evaluateCondition(element.conditions.show_if, variables);
    if (!shouldShow) return null;
  }

  const style = convertStyle(element.style || {});
  const isToggled = toggledIds.has(element.id);

  // Apply toggle visual state
  const hasToggleAction = element.action?.type === 'toggle' ||
    element.actions?.some(a => a.type === 'toggle');
  if (hasToggleAction) {
    if (isToggled) {
      style.borderWidth = 2;
      style.borderColor = (element.style?.borderColor as string) || '#000000';
    } else {
      style.borderWidth = (element.style?.borderWidth as number) || 2;
      style.borderColor = 'transparent';
    }
  }

  // Conditional visibility based on selection group state
  if (element.visibleWhen) {
    const groupHasSelection = !!groupSelections[element.visibleWhen.group];
    const shouldShow = groupHasSelection === element.visibleWhen.hasSelection;
    style.opacity = shouldShow ? 1 : 0;
    (style as any).pointerEvents = shouldShow ? 'auto' : 'none';
  }

  // Wrap in TouchableOpacity if element has an action or actions
  const hasAction = !!element.action || (element.actions && element.actions.length > 0);
  const wrapWithAction = (content: React.ReactElement): React.ReactElement => {
    if (!hasAction) return content;

    // Extract width/alignment styles that should apply to TouchableOpacity wrapper
    // This ensures buttons with width: "100%" don't shrink to content
    const wrapperStyle: any = {};
    if (style.width) wrapperStyle.width = style.width;
    if (style.alignSelf) wrapperStyle.alignSelf = style.alignSelf;

    return (
      <TouchableOpacity
        key={element.id}
        activeOpacity={0.7}
        onPress={() => onAction(element)}
        style={wrapperStyle}
      >
        {content}
      </TouchableOpacity>
    );
  };

  const childProps = { toggledIds, groupSelections, onAction, variables, onSetVariable, inputValues, setInputValues };

  switch (element.type) {
    // ─── Containers ───

    case 'vstack': {
      const vstackContent = (
        <View style={[style, { flexDirection: 'column' }]}>
          {element.children?.map((child) => (
            <RenderNode key={child.id} element={child} {...childProps} />
          ))}
        </View>
      );
      return wrapWithAction(
        element.style?.backgroundGradient
          ? wrapWithGradient(vstackContent, element.style, { ...style, flexDirection: 'column' })
          : vstackContent
      );
    }

    case 'hstack': {
      const hstackContent = (
        <View style={[style, { flexDirection: 'row' }]}>
          {element.children?.map((child) => (
            <RenderNode key={child.id} element={child} {...childProps} />
          ))}
        </View>
      );
      return wrapWithAction(
        element.style?.backgroundGradient
          ? wrapWithGradient(hstackContent, element.style, { ...style, flexDirection: 'row' })
          : hstackContent
      );
    }

    case 'zstack': {
      const zstackContent = (
        <View style={style}>
          {element.children?.map((child, index) => {
            const childStyle = convertStyle(child.style || {});
            if (index > 0 && !child.position?.type) {
              return (
                <View
                  key={child.id}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  <RenderNode element={child} {...childProps} />
                </View>
              );
            }
            return <RenderNode key={child.id} element={child} {...childProps} />;
          })}
        </View>
      );
      return wrapWithAction(
        element.style?.backgroundGradient
          ? wrapWithGradient(zstackContent, element.style, style)
          : zstackContent
      );
    }

    case 'scrollview': {
      const isHorizontal = element.props?.direction === 'horizontal';
      return (
        <ScrollView
          style={style}
          horizontal={isHorizontal}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {isHorizontal ? (
            <View style={{ flexDirection: 'row', gap: element.style?.gap }}>
              {element.children?.map((child) => (
                <RenderNode key={child.id} element={child} {...childProps} />
              ))}
            </View>
          ) : (
            element.children?.map((child) => (
              <RenderNode key={child.id} element={child} {...childProps} />
            ))
          )}
        </ScrollView>
      );
    }

    // ─── Content Elements ───

    case 'text': {
      const resolvedText = resolveTemplate(element.props?.text || '', variables);
      return (
        <Text style={style as TextStyle}>
          {resolvedText}
        </Text>
      );
    }

    case 'icon': {
      if (element.props?.emoji) {
        return (
          <Text style={[style as TextStyle, { textAlign: 'center' }]}>
            {element.props.emoji}
          </Text>
        );
      }
      // Try to render a real vector icon
      const library = (element.props?.library || 'material').toLowerCase();
      const iconName = element.props?.name;
      const IconComponent = IconSets[library];
      if (IconComponent && iconName) {
        const iconSize = (style as TextStyle).fontSize || 24;
        const iconColor = (style as TextStyle).color || '#000000';
        return (
          <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
            <IconComponent name={iconName} size={iconSize} color={iconColor} />
          </View>
        );
      }
      // Fallback — render icon name as text placeholder
      return (
        <View
          style={[
            style,
            {
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (style as ViewStyle).backgroundColor || '#f0f0f0',
              borderRadius: ((style as ViewStyle).borderRadius as number) || 6,
            },
          ]}
        >
          <Text style={{ fontSize: 10, color: '#666' }}>
            {element.props?.name || '●'}
          </Text>
        </View>
      );
    }

    case 'image':
      if (element.props?.url) {
        return (
          <Image
            source={{ uri: element.props.url }}
            style={[style as ImageStyle, { resizeMode: 'cover' }]}
          />
        );
      }
      // Placeholder for images without URL
      return (
        <View
          style={[
            style,
            {
              backgroundColor: (style as ViewStyle).backgroundColor || '#f0f0f0',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>🖼️</Text>
          {element.props?.imageDescription && (
            <Text style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: 8 }}>
              {element.props.imageDescription}
            </Text>
          )}
        </View>
      );

    case 'video':
      // Video placeholder — actual implementation would use expo-av or react-native-video
      return (
        <View
          style={[
            style,
            {
              backgroundColor: (style as ViewStyle).backgroundColor || '#1a1a1a',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>🎬</Text>
          {element.props?.videoDescription && (
            <Text style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: 8 }}>
              {element.props.videoDescription}
            </Text>
          )}
        </View>
      );

    case 'lottie':
      // Lottie placeholder — actual implementation would use lottie-react-native
      return (
        <View
          style={[
            style,
            {
              backgroundColor: (style as ViewStyle).backgroundColor || '#f8f8ff',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>✨</Text>
          {element.props?.animationDescription && (
            <Text style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: 8 }}>
              {element.props.animationDescription}
            </Text>
          )}
        </View>
      );

    case 'input': {
      // Only apply default border if borderWidth is not explicitly defined (including 0)
      const inputStyle = style as TextStyle;
      const defaultInputStyle: TextStyle = {};
      if (element.style?.borderWidth === undefined && element.style?.borderColor === undefined) {
        defaultInputStyle.borderWidth = 1;
        defaultInputStyle.borderColor = '#E5E5E5';
      }

      // Get the variable name - use props.variable if specified, otherwise use element.id
      const variableName = element.props?.variable || element.id;
      // Use local state value, or fall back to variables, or empty string
      const currentValue = inputValues[variableName] ?? variables[variableName] ?? '';

      return (
        <TextInput
          style={[defaultInputStyle, inputStyle]}
          placeholder={element.props?.placeholder || 'Enter text...'}
          keyboardType={getKeyboardType(element.props?.type)}
          secureTextEntry={element.props?.type === 'password'}
          autoCapitalize={element.props?.type === 'email' ? 'none' : 'sentences'}
          value={currentValue}
          onChangeText={(text) => {
            // Save to local state only - don't trigger parent re-render
            setInputValues(prev => ({ ...prev, [variableName]: text }));
          }}
        />
      );
    }

    case 'spacer':
      return <View style={style || { flex: 1 }} />;

    case 'divider':
      return (
        <View
          style={[
            {
              height: 1,
              backgroundColor: '#e0e0e0',
              width: '100%',
            },
            style,
          ]}
        />
      );

    default:
      return null;
  }
};

// ─── Style Converter ───

function convertStyle(style: ElementStyle | Record<string, any>): ViewStyle & TextStyle {
  const rnStyle: any = {};

  if (!style) return rnStyle;

  // Layout
  if (style.flex !== undefined) rnStyle.flex = style.flex;
  if (style.justifyContent) rnStyle.justifyContent = style.justifyContent;
  if (style.alignItems) rnStyle.alignItems = style.alignItems;
  if (style.alignSelf) rnStyle.alignSelf = style.alignSelf;
  if (style.gap !== undefined) rnStyle.gap = style.gap;
  if (style.flexWrap) rnStyle.flexWrap = style.flexWrap;
  if (style.overflow) rnStyle.overflow = style.overflow;

  // Spacing
  if (style.padding !== undefined) rnStyle.padding = style.padding;
  if (style.paddingTop !== undefined) rnStyle.paddingTop = style.paddingTop;
  if (style.paddingBottom !== undefined) rnStyle.paddingBottom = style.paddingBottom;
  if (style.paddingLeft !== undefined) rnStyle.paddingLeft = style.paddingLeft;
  if (style.paddingRight !== undefined) rnStyle.paddingRight = style.paddingRight;
  if (style.marginTop !== undefined) rnStyle.marginTop = style.marginTop;
  if (style.marginBottom !== undefined) rnStyle.marginBottom = style.marginBottom;
  if (style.marginLeft !== undefined) rnStyle.marginLeft = style.marginLeft;
  if (style.marginRight !== undefined) rnStyle.marginRight = style.marginRight;

  // Size
  if (style.width !== undefined) rnStyle.width = style.width;
  if (style.height !== undefined) rnStyle.height = style.height;
  if (style.maxWidth !== undefined) rnStyle.maxWidth = style.maxWidth;
  if (style.minHeight !== undefined) rnStyle.minHeight = style.minHeight;

  // Visual
  if (style.backgroundColor) rnStyle.backgroundColor = style.backgroundColor;
  if (style.opacity !== undefined) rnStyle.opacity = style.opacity;
  if (style.borderRadius !== undefined) rnStyle.borderRadius = style.borderRadius;
  if (style.borderWidth !== undefined) rnStyle.borderWidth = style.borderWidth;
  if (style.borderColor) rnStyle.borderColor = style.borderColor;
  if (style.borderBottomWidth !== undefined) rnStyle.borderBottomWidth = style.borderBottomWidth;
  if (style.borderBottomColor) rnStyle.borderBottomColor = style.borderBottomColor;

  // Shadow (React Native uses different shadow props)
  if (style.shadowColor) {
    rnStyle.shadowColor = style.shadowColor;
    rnStyle.shadowOpacity = style.shadowOpacity || 0.2;
    rnStyle.shadowRadius = style.shadowRadius || 4;
    rnStyle.shadowOffset = {
      width: style.shadowOffsetX || 0,
      height: style.shadowOffsetY || 2,
    };
    // Android elevation approximation
    rnStyle.elevation = style.shadowRadius || 4;
  }

  // Text
  if (style.color) rnStyle.color = style.color;
  if (style.fontSize !== undefined) rnStyle.fontSize = style.fontSize;
  if (style.fontWeight) rnStyle.fontWeight = style.fontWeight;
  if (style.textAlign) rnStyle.textAlign = style.textAlign;
  if (style.lineHeight !== undefined) {
    // React Native lineHeight is in pixels, not a multiplier
    // If value is small (< 4), treat as multiplier and convert
    rnStyle.lineHeight =
      style.lineHeight > 4 ? style.lineHeight : (style.fontSize || 16) * style.lineHeight;
  }
  if (style.letterSpacing !== undefined) rnStyle.letterSpacing = style.letterSpacing;
  if (style.textTransform) rnStyle.textTransform = style.textTransform;
  if (style.textDecorationLine) rnStyle.textDecorationLine = style.textDecorationLine;

  // backgroundGradient is handled by wrapWithGradient at the component level.
  // If LinearGradient is not available, fall back to the first gradient color.
  if (style.backgroundGradient && !LinearGradient && style.backgroundGradient.colors?.length) {
    const firstColor = style.backgroundGradient.colors[0];
    rnStyle.backgroundColor = typeof firstColor === 'string' ? firstColor : firstColor.color;
  }

  return rnStyle;
}

// ─── Gradient Wrapper ───

function angleToCoords(angle: number): { start: { x: number; y: number }; end: { x: number; y: number } } {
  // Convert CSS angle (0 = top, 90 = right) to LinearGradient coordinates
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    start: { x: 0.5 - Math.cos(rad) * 0.5, y: 0.5 - Math.sin(rad) * 0.5 },
    end: { x: 0.5 + Math.cos(rad) * 0.5, y: 0.5 + Math.sin(rad) * 0.5 },
  };
}

function wrapWithGradient(
  content: React.ReactElement,
  elementStyle: ElementStyle | Record<string, any>,
  viewStyle: any
): React.ReactElement {
  const gradient = elementStyle?.backgroundGradient;
  if (!gradient || !LinearGradient || !gradient.colors?.length) return content;

  // Handle both { color, position } objects and plain color strings
  const colors = gradient.colors.map((c: any) => typeof c === 'string' ? c : c.color);
  const locations = gradient.colors.map((c: any, i: number, arr: any[]) => {
    if (typeof c === 'string') return i / Math.max(arr.length - 1, 1);
    return (c.position ?? Math.round((i / Math.max(arr.length - 1, 1)) * 100)) / 100;
  });

  // Pull layout-affecting styles onto the gradient wrapper, keep inner styles on the content
  const { backgroundColor, ...innerStyle } = viewStyle;
  const gradientStyle: any = { ...innerStyle };

  const gradientType = gradient.type || 'linear';
  if (gradientType === 'radial') {
    // No radial support in LinearGradient — use first color as fallback
    return React.cloneElement(content, {
      style: [viewStyle, { backgroundColor: colors[0] }],
    });
  }

  // Support both angle and start/end array formats
  let coords;
  if (gradient.start && gradient.end) {
    const s = Array.isArray(gradient.start) ? { x: gradient.start[0], y: gradient.start[1] } : gradient.start;
    const e = Array.isArray(gradient.end) ? { x: gradient.end[0], y: gradient.end[1] } : gradient.end;
    coords = { start: s, end: e };
  } else {
    coords = angleToCoords(gradient.angle ?? 180);
  }

  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={coords.start}
      end={coords.end}
      style={gradientStyle}
    >
      {content.props.children}
    </LinearGradient>
  );
}

// ─── Helpers ───

function getKeyboardType(type?: string) {
  switch (type) {
    case 'email':
      return 'email-address' as const;
    case 'tel':
    case 'number':
      return 'numeric' as const;
    default:
      return 'default' as const;
  }
}
