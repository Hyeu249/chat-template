import { Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';

type WrapperProps = {
  children: React.ReactNode;
};

function Wrapper({ children }: WrapperProps) {
  if (Platform.OS === 'web') {
    return <>{children}</>; // Web thì không bọc
  }
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      {children}
    </TouchableWithoutFeedback>
  );
}

export default Wrapper;
