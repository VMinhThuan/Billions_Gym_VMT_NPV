import React from 'react';
import { Text as RNText } from 'react-native';

const CustomText = ({ style, children, ...props }) => {
  const customStyle = [
    { fontFamily: 'Poppins' },
    style
  ];

  return (
    <RNText style={customStyle} {...props}>
      {children}
    </RNText>
  );
};

export default CustomText;