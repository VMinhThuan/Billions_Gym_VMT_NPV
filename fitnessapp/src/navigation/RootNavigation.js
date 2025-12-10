import * as React from 'react';
import { StackActions } from '@react-navigation/native';

export const navigationRef = React.createRef();

export const navigate = (name, params) => {
    if (navigationRef.current && name) {
        navigationRef.current.navigate(name, params);
    }
};

export const replace = (name, params) => {
    if (navigationRef.current && name) {
        navigationRef.current.dispatch(StackActions.replace(name, params));
    }
};

export const resetTo = (routes) => {
    if (navigationRef.current && Array.isArray(routes)) {
        navigationRef.current.reset({
            index: routes.length - 1,
            routes,
        });
    }
};

