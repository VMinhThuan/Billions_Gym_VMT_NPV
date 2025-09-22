import React, { useRef, useState } from 'react';
import { StyleSheet, ImageBackground, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const slides = [
    {
        key: 1,
        title: 'Fitness App',
        text: 'Track your workouts and challenge\nyour friends for hardcore fun',
        image: require('../../assets/images/onboarding-img1.avif'),
    },
    {
        key: 2,
        title: 'Plan Smarter',
        text: 'Create custom plans and stay motivated\nwith daily reminders.',
        image: require('../../assets/images/onboarding-img2.avif'),
    },
    {
        key: 3,
        title: 'Stay Fit Together',
        text: 'Connect with a community of fitness\nenthusiasts and grow stronger.',
        image: require('../../assets/images/onboarding-img3.avif'),
    }
];

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef(null);

    const handleStartPress = () => {
        if (currentIndex === slides.length - 1) {
            navigation.navigate('Login');
        } else {
            sliderRef.current?.goToSlide(currentIndex + 1, true);
        }
    };

    const renderItem = ({ item, index }) => (
        <ImageBackground source={item.image} style={styles.imageBackground}>
            <View style={styles.overlay}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.text}>{item.text}</Text>

                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleStartPress}>
                    {index === slides.length - 1 ? (
                        <Text style={styles.buttonText}>Bắt đầu</Text>
                    ) : (
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );

    return (
        <AppIntroSlider
            ref={sliderRef}
            renderItem={renderItem}
            data={slides}
            showSkipButton={false}
            showNextButton={false}
            showDoneButton={false}
            onSlideChange={(index) => setCurrentIndex(index)}
            dotStyle={[styles.dotStyle, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)' }]}
            activeDotStyle={[styles.activeDotStyle, { backgroundColor: colors.primary }]}
        />
    );
};

const styles = StyleSheet.create({
    imageBackground: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'flex-end',
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0)',
        padding: 30,
        alignItems: 'flex-start',
        paddingBottom: 160,
    },
    title: {
        fontSize: 45,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 10,
        color: '#fff',
    },
    text: {
        fontSize: 21,
        textAlign: 'left',
        lineHeight: 30,
        marginBottom: 20,
        color: '#ccc'
    },
    dotStyle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    activeDotStyle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 34,
        alignSelf: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default OnboardingScreen;