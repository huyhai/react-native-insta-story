import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  View,
  Platform,
  SafeAreaView,
  PanResponderGestureState,
} from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';

import { usePrevious, isNullOrWhitespace } from './helpers';
import {
  IUserStoryItem,
  NextOrPrevious,
  StoryListItemProps,
} from './interfaces';

const { width, height } = Dimensions.get('window');
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import {Input} from 'react-native-elements';
import FloatingHearts from 'react-native-floating-hearts';

export const StoryListItem = ({
  index,
  key,
  profileImage,
  profileName,
  duration,
  customCloseComponent,
  customSwipeUpComponent,
  onFinish,
  onClosePress,
  onPressAvatar,
  onReport,
  stories,
  onSend,
  showInput,
  currentPage,
  ...props
}: StoryListItemProps) => {
  const [load, setLoad] = useState<boolean>(true);
  const [pressed, setPressed] = useState<boolean>(false);
  const [count, setCount] = useState(0);
  const [icon, setIcon] = useState(null);
  const [content, setContent] = useState<IUserStoryItem[]>(
    stories.map((x) => ({
      ...x,
      finish: 0,
    })),
  );

  const [current, setCurrent] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;

  const prevCurrentPage = usePrevious(currentPage);

  useEffect(() => {
    let isPrevious = !!prevCurrentPage && prevCurrentPage > currentPage;
    if (isPrevious) {
      setCurrent(content.length - 1);
    } else {
      setCurrent(0);
    }

    let data = [...content];
    data.map((x, i) => {
      if (isPrevious) {
        x.finish = 1;
        if (i == content.length - 1) {
          x.finish = 0;
        }
      } else {
        x.finish = 0;
      }
    });
    setContent(data);
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const prevCurrent = usePrevious(current);

  useEffect(() => {
    if (!isNullOrWhitespace(prevCurrent)) {
      if (prevCurrent) {
        if (
          current > prevCurrent &&
          content[current - 1].story_image == content[current].story_image
        ) {
          start();
        } else if (
          current < prevCurrent &&
          content[current + 1].story_image == content[current].story_image
        ) {
          start();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function start() {
    setLoad(false);
    progress.setValue(0);
    startAnimation();
  }

  function startAnimation() {
    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        next();
      }
    });
  }

  function onSwipeUp(_props?: any) {
    if (onClosePress) {
      onClosePress();
    }
    if (content[current].onPress) {
      content[current].onPress?.();
    }
  }

  function onSwipeDown(_props?: any) {
    onClosePress();
  }

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  function next() {
    // check if the next content is not empty
    setLoad(true);
    if (current !== content.length - 1) {
      let data = [...content];
      data[current].finish = 1;
      setContent(data);
      setCurrent(current + 1);
      progress.setValue(0);
    } else {
      // the next content is empty
      close('next');
    }
  }

  function previous() {
    // checking if the previous content is not empty
    setLoad(true);
    if (current - 1 >= 0) {
      let data = [...content];
      data[current].finish = 0;
      setContent(data);
      setCurrent(current - 1);
      progress.setValue(0);
    } else {
      // the previous content is empty
      close('previous');
    }
  }

  function close(state: NextOrPrevious) {
    let data = [...content];
    data.map((x) => (x.finish = 0));
    setContent(data);
    progress.setValue(0);
    if (currentPage == index) {
      if (onFinish) {
        onFinish(state);
      }
    }
  }

  const swipeText =
    content?.[current]?.swipeText || props.swipeText || 'Swipe Up';
  const timeLabel = content?.[current]?.timeLabel;
  
  const InputView = () => {
    const [text, setText] = useState('');
    const [show, setShow] = useState(false);
  
    const animateIcon = text2 => {
      setText(text + String.fromCodePoint(text2));
    };
    const onSendT = text => {
      setText('');
      onSend(text, current);
    };
    const onSendEmoji = (text, index) => {
      setText('');
      onSend(String.fromCodePoint(text), current);
      let ic ='';
      if(index === 1){
        ic=<Icon name="heart" size={100} color={'red'} />;
      }else if(index===2){
        ic= <Text style={styles.ic, {fontSize: 100}}>&#128558;</Text>
      }else if(index===3){
        ic= <Text style={styles.ic, {fontSize: 100}}>&#128514;</Text>
      }else if(index===4){
        ic= <Text style={styles.ic, {fontSize: 100}}>&#128546;</Text>
      }else if(index===5){
        ic= <Text style={styles.ic, {fontSize: 100}}>&#128545;</Text>
      }
      setIcon(ic);
      setCount(count+1);
    };
    const showModal = () => {
      return (
        <Modal
        isVisible={show}
          onBackdropPress={() => setShow(false)}
          avoidKeyboard
          swipeDirection="down"
          style={{justifyContent: 'flex-end'}}>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Input
              containerStyle={{flex: 8, justifyContent: 'center'}}
              placeholder="Aa..."
              placeholderTextColor={'white'}
              value={text}
              autoFocus
              onChangeText={text => setText(text)}
              inputStyle={styles.in}
              inputContainerStyle={styles.input}
            />
            <TouchableOpacity
              onPress={() => onSendT(text)}
              style={{flex: 2, alignItems: 'center', marginTop: 3}}>
              <Icon name="send" size={35} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      );
    };
    return (
      <View style={[styles.v, {paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,}]}>
        <Text onPress={() => onSendEmoji('9829')} style={styles.ic}>
          &#9829;
        </Text>
        <Text onPress={() => onSendEmoji('128558')} style={styles.ic}>
          &#128558;
        </Text>
        <Text onPress={() => onSendEmoji('128514')} style={styles.ic}>
          &#128514;
        </Text>
        <Text onPress={() => onSendEmoji('128546')} style={styles.ic}>
          &#128546;
        </Text>
        <Text onPress={() => onSendEmoji('128545')} style={styles.ic}>
          &#128545;
        </Text>
        <TouchableOpacity
          onPress={() => setShow(true)}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="android-messages" size={30} color="white" />
        </TouchableOpacity>
        {showModal()}
      </View>
    );
  }
  
  return (
    <GestureRecognizer
      key={key}
      onSwipeUp={onSwipeUp}
      onSwipeDown={onSwipeDown}
      config={config}
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}
    >
      <SafeAreaView>
        <View style={styles.backgroundContainer}>
          <Image
            onLoadEnd={() => start()}
            source={{ uri: content[current].story_image }}
            style={styles.image}
          />
          {load && (
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={'white'} />
            </View>
          )}
        </View>
      </SafeAreaView>
      <View style={{ flexDirection: 'column', flex: 1 }}>
        <View style={styles.animationBarContainer}>
          {content.map((index, key) => {
            return (
              <View key={key} style={styles.animationBackground}>
                <Animated.View
                  style={{
                    flex: current == key ? progress : content[key].finish,
                    height: 2,
                    backgroundColor: 'white',
                  }}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.userContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
              if (onPressAvatar) {
                onPressAvatar();
              }
            }}>
              <Image style={styles.avatarImage} source={{ uri: profileImage }} />
            </TouchableOpacity>
            <Text style={styles.avatarText}>{profileName + ' ~ ' + timeLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (onReport) {
                onReport(current);
              }
              if (onClosePress) {
                onClosePress(current);
              }
            }}
          >
            <View style={styles.closeIconContainer}>
              {customCloseComponent ? (
                customCloseComponent
              ) : (
                <Text style={{ color: 'white' }}>X</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.pressContainer}>
          <TouchableWithoutFeedback
            onPressIn={() => progress.stopAnimation()}
            onLongPress={() => setPressed(true)}
            onPressOut={() => {
              setPressed(false);
              startAnimation();
            }}
            onPress={() => {
              if (!pressed && !load) {
                previous();
              }
            }}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onPressIn={() => progress.stopAnimation()}
            onLongPress={() => setPressed(true)}
            onPressOut={() => {
              setPressed(false);
              startAnimation();
            }}
            onPress={() => {
              if (!pressed && !load) {
                next();
              }
            }}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </View>
      </View>
      {content[current].onPress && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onSwipeUp}
          style={styles.swipeUpBtn}
        >
          {customSwipeUpComponent ? (
            customSwipeUpComponent
          ) : (
            <>
              <Text style={{ color: 'white', marginTop: 5 }}></Text>
              <Text style={{ color: 'white', marginTop: 5 }}>{swipeText}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {showInput && InputView()}
      <FloatingHearts
        count={count}
        renderCustomShape={() => {
          return icon;
        }}
      />
    </GestureRecognizer>
  );
};

export default StoryListItem;

StoryListItem.defaultProps = {
  duration: 10000,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  spinnerContainer: {
    zIndex: -100,
    position: 'absolute',
    justifyContent: 'center',
    backgroundColor: 'black',
    alignSelf: 'center',
    width: width,
    height: height,
  },
  animationBarContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  animationBackground: {
    height: 2,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(117, 117, 117, 0.5)',
    marginHorizontal: 2,
  },
  userContainer: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  avatarImage: {
    height: 30,
    width: 30,
    borderRadius: 100,
  },
  avatarText: {
    fontWeight: 'bold',
    color: 'white',
    paddingLeft: 10,
  },
  closeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 15,
  },
  pressContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  swipeUpBtn: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
    bottom: Platform.OS == 'ios' ? 20 : 50,
  },
  input: {
    borderBottomColor: 'transparent',
    backgroundColor: 'rgba(0,0,0, 0.3)',
    borderRadius: 20,
  },
  in: {
    color: 'white',
    paddingHorizontal: 10,
    height: 40,
    fontSize: 14,
  },
  ic: {fontSize: 25, color: 'red'},
  v: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
