// screens/OnboardingScreen.js
import React from 'react';
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
    return (
        <Onboarding
            onSkip={() => navigation.replace('Home')}
            onDone={() => navigation.replace('Home')}
            containerStyles={{ flex: 1 }}
            pages={[
                {
                    backgroundColor: '#ffffff',
                    image: (
                        <Image
                            source={require('../../assets/images/onboarding-img1.avif')}
                            style={styles.image}
                        />
                    ),
                    title: 'Welcome to Fitness App',
                    subtitle: 'Track your workouts and reach your goals!',
                },
                {
                    backgroundColor: '#ffffff',
                    image: (
                        <Image
                            source={require('../../assets/images/onboarding-img1.avif')}
                            style={styles.image}
                        />
                    ),
                    title: 'Create a Plan',
                    subtitle: 'Personalize your workout plan easily.',
                },
                {
                    backgroundColor: '#ffffff',
                    image: (
                        <Image
                            source={require('../../assets/images/onboarding-img1.avif')}
                            style={styles.image}
                        />
                    ),
                    title: 'Stay Motivated',
                    subtitle: 'Get reminders and stats to keep you going.',
                },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    image: {
        width,
        height,
        resizeMode: 'cover',
        opacity: 0.7,
    },
});
