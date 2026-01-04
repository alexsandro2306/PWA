import React from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import TrainersList from '../pages/TrainersList';
import Navbar from './Navbar';

const TrainersListWrapper = () => {
    const { isAuthenticated } = useAuth();

    // If authenticated, show with MainLayout (navbar + sidebar)
    if (isAuthenticated) {
        return (
            <MainLayout>
                <TrainersList />
            </MainLayout>
        );
    }

    // If not authenticated, show with Landing page Navbar
    return (
        <>
            <Navbar />
            <TrainersList />
        </>
    );
};

export default TrainersListWrapper;
