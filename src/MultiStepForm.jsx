// MultiStepForm.jsx
import { useState } from 'react';
import { TextField, Button, Stepper, Step, StepLabel, Typography, Grid } from '@mui/material';
import 'react-phone-input-2/lib/style.css';

import { useNavigate } from 'react-router-dom';
import { db } from './firebase.config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import './MultiStepForm.css';
import LottieAnimation from './LottieAnimation';
import FinishingAnimation from './FinishingAnimation';

import img1 from './assets/66398c2d1946fd86bce731bd_3.png'
import img2 from './assets/66398c2d8e95b96249977819_1.png'
import img3 from './assets/66398c2d8e95b9624997780c_2.png'

const MultiStepForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loanAmount, setLoanAmount] = useState('');
    const [timePeriod, setTimePeriod] = useState('');
    const [monthlyRevenue, setMonthlyRevenue] = useState('');
    const [creditScore, setCreditScore] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        businessName: '',
        // agreement: false,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        businessName: '',
        // agreement: ''
    });
    const [taxDetails, setTaxDetails] = useState({ SSN: '', });
    const [errorMessages, setErrorMessages] = useState({ SSN: '', });
    // eslint-disable-next-line no-unused-vars
    const [preApproved, setPreApproved] = useState(false);

    const navigate = useNavigate();

    const steps = ['1', '2', '3', '4', '5'];

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleLoanAmountChange = (event) => {
        // Remove all non-digits and then format
        const amount = event.target.value.replace(/\D/g, ''); // Remove non-digits
        const formattedAmount = amount.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Insert commas
        setLoanAmount(formattedAmount);
    };


    const handleTimePeriodSelect = (period) => {
        setTimePeriod(period);
        handleNext()
    };

    const handleMonthlyRevenueSelect = (revenue) => {
        setMonthlyRevenue(revenue);
        handleNext()
    };

    const handleCreditScoreSelect = (score) => {
        setCreditScore(score);
        handleNext()
    };

    const handlePhoneInputChange = (event) => {
        const input = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
        let formattedInput = '';
        let errorMessage = '';

        // Break the string into parts and format
        if (input.length > 0) {
            formattedInput += `(${input.substring(0, 3)}`; // Area code
        }
        if (input.length >= 4) {
            formattedInput += `) ${input.substring(3, 6)}`; // Prefix
        }
        if (input.length > 6) {
            formattedInput += `-${input.substring(6, 10)}`; // Line number
        }

        // Validate phone number length
        if (input.length < 10) {
            errorMessage = 'Complete phone number required';
        }

        // Update state
        setFormData({
            ...formData,
            contactNumber: formattedInput
        });

        // Set or clear error message
        setErrors({
            ...errors,
            contactNumber: errorMessage
        });
    };

    const validatePhoneInputOnBlur = () => {
        const errorMessage = formData.contactNumber.length < 14 ? 'Complete phone number required' : '';
        setErrors({
            ...errors,
            contactNumber: errorMessage
        });
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'firstName':
            case 'lastName':
            case 'businessName':
                if (!value.trim()) {
                    return 'This field cannot be empty';
                }
                break;
            case 'email':
                if (!/\S+@\S+\.\S+/.test(value)) {
                    return 'Please enter a valid email address';
                }
                break;
            case 'contactNumber':
                if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(value)) {
                    return 'Please enter a valid phone number (e.g., (123) 456-7890)';
                }
                break;
            case 'SSN':
                if (!/^\d{3}-\d{2}-\d{4}$/.test(value)) {
                    return 'Please enter a valid SSN (e.g., 123-45-6789)';
                }
                break;
            default:
                return '';
        }
        return '';
    };



    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Set the form data
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        // Validate the field and update the error state
        const error = validateField(name, value);
        setErrors({
            ...errors,
            [name]: error
        });
    };

    const handleInputChangeSSN = (setter, errorSetter) => (event) => {
        const { name, value } = event.target;
        const formattedValue = formatValue(value, name); // Format the input value
        setter(prevState => ({ ...prevState, [name]: formattedValue }));

        // Validate SSN field
        const error = validateField(name, formattedValue);
        errorSetter(prevState => ({ ...prevState, [name]: error }));
    };


    const formatValue = (value, name) => {
        // Remove any non-digit characters
        let formattedValue = value.replace(/\D/g, '');

        // Apply formatting based on input type
        if (name === 'SSN') {
            if (formattedValue.length > 9) {
                formattedValue = formattedValue.slice(0, 9);
            }
            if (formattedValue.length <= 3) {
                formattedValue = formattedValue;
            } else if (formattedValue.length <= 5) {
                formattedValue = `${formattedValue.slice(0, 3)}-${formattedValue.slice(3, 5)}`;
            } else {
                formattedValue = `${formattedValue.slice(0, 3)}-${formattedValue.slice(3, 5)}-${formattedValue.slice(5, 9)}`;
            }
        }
        return formattedValue;
    };
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'loanApplications'), where('email', '==', formData.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await addDoc(collection(db, 'loanApplications'), {
                    loanAmount,
                    timePeriod,
                    monthlyRevenue,
                    creditScore,
                    SSN: taxDetails.SSN,
                    ...formData
                });
                setMessage('You have been pre-approved successfully!');
            } else {
                setMessage('You have been pre-approved successfully!');
                setPreApproved(true); // Set pre-approved state
            }

            setLoading(false);
            setActiveStep(steps.length);
        } catch (error) {
            console.error("Error adding document: ", error);
            setLoading(false);
        }
    };

    const isStep4Valid = () => {
        return Object.values(formData).every(value => value) && Object.values(errors).every(error => !error) && !!taxDetails.SSN;
    };


    const changeForm = () => {
        navigate('/extended-form', {
            state: {
                formData: formData,
                loanAmount: loanAmount,
                creditScore: creditScore,
                monthlyRevenue: monthlyRevenue

            }
        })
    }

    return (
        <div className="form-container">
            <Typography align="center" gutterBottom className="title">
                QUICK & FLEXIBLE BUSINESS LOANS
            </Typography>
            <div style={{ display: "flex", justifyContent: "center", }} >
                <img src={img1} alt="" style={{ width: "180px" }} />
                <img src={img2} alt="" style={{ width: "180px", margin: "0 20px" }} />
                <img src={img3} alt="" style={{ width: "180px" }} />
            </div>
            <Typography align="center" gutterBottom className="subtitle">
                Get Pre-Qualified for Financing
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel className="stepper">
                {steps.map((label, index) => (
                    <Step key={index}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {loading ? (
                <div className="loading-container">
                    <LottieAnimation />
                </div>
            ) : (
                <>
                    {activeStep === 0 && (
                        <div className="step-content">
                            <Typography variant="h5" align="center" gutterBottom className="step-title">
                                Enter your desired loan amount.
                            </Typography>
                            <TextField
                                type="text"
                                label="Loan Amount"
                                value={loanAmount}
                                onChange={handleLoanAmountChange}
                                fullWidth
                                placeholder='25,000'
                                margin="normal"
                                InputProps={{
                                    startAdornment: <span className="dollar-sign">$</span>,
                                    classes: {
                                        input: 'loan-amount-input' // Add this line
                                    }
                                }}
                                className="loan-amount-input"
                            />

                            <div className="step-navigation">
                                <Button variant="contained" onClick={handleNext} className="loan-next-button" disabled={!loanAmount}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                    {activeStep === 1 && (
                        <div className="step-content">
                            <Typography variant="h5" align="center" gutterBottom className="step-title">
                                Business Operating Time
                            </Typography>
                            <Grid container spacing={3}>
                                {[
                                    "Less than 3 months",
                                    "3 - 5 months",
                                    "6 - 12 months",
                                    "1 - 2 years",
                                    "2 - 5 years",
                                    "More than 5 years",
                                    "I currently don't own a business",
                                ].map((period) => (
                                    <Grid item xs={6} key={period}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            className={`time-period-button ${timePeriod === period ? 'selected' : ''}`}
                                            onClick={() => handleTimePeriodSelect(period)}
                                        >
                                            {period}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                            <div className="step-navigation">
                                <Button variant="contained" color="secondary" onClick={handleBack} className="loan-next-button">
                                    Back
                                </Button>
                                {/* <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    className="next-button"
                                    disabled={!timePeriod}
                                >
                                    Next
                                </Button> */}
                            </div>
                        </div>
                    )}
                    {activeStep === 2 && (
                        <div className="step-content">
                            <Typography variant="h5" align="center" gutterBottom className="step-title">
                                Gross Monthly Revenue
                            </Typography>
                            <Grid container spacing={3}>
                                {[
                                    "Less than $1,000",
                                    "$1,000 - $5,000",
                                    "$5,000 - $15,000",
                                    "$15,000 - $20,000",
                                    "$20,000 - $30,000",
                                    "$30,000 - $50,000",
                                    "$50,000 - $100,000",
                                    "$100,000 - $200,000",
                                    "$200,000+",
                                ].map((revenue) => (
                                    <Grid item xs={6} key={revenue}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            className={`time-period-button ${monthlyRevenue === revenue ? 'selected' : ''}`}
                                            onClick={() => handleMonthlyRevenueSelect(revenue)}
                                        >
                                            {revenue}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                            <div className="step-navigation">
                                <Button variant="contained" color="secondary" onClick={handleBack} className="loan-next-button">
                                    Back
                                </Button>
                                {/* <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    className="next-button"
                                    disabled={!monthlyRevenue}
                                >
                                    Next
                                </Button> */}
                            </div>
                        </div>
                    )}
                    {activeStep === 3 && (
                        <div className="step-content">
                            <Typography variant="h5" align="center" gutterBottom className="step-title">
                                Personal Credit Score
                            </Typography>
                            <Grid container spacing={3}>
                                {[
                                    "500 and Below",
                                    "500 - 549",
                                    "550 - 599",
                                    "600 - 649",
                                    "650 - 719",
                                    "720 or Above",
                                    "Not Sure",
                                ].map((score) => (
                                    <Grid item xs={6} key={score}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            className={`time-period-button ${creditScore === score ? 'selected' : ''}`}
                                            onClick={() => handleCreditScoreSelect(score)}
                                        >
                                            {score}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                            <div className="step-navigation">
                                <Button variant="contained" color="secondary" onClick={handleBack} className="loan-next-button">
                                    Back
                                </Button>
                                {/* <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    className="next-button"
                                    disabled={!creditScore}
                                >
                                    Next
                                </Button> */}
                            </div>
                        </div>
                    )}
                    {activeStep === 4 && (
                        <div className="step-content">
                            <Typography variant="h5" align="center" gutterBottom className="step-title">
                                Input your basic business information
                            </Typography>
                            <Typography variant="body1" align="center" gutterBottom className="sub-text">
                                And get your loan offer now!
                            </Typography>
                            <Grid container spacing={0}>
                                <Grid item xs={5.8} >
                                    <TextField
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                        onBlur={handleInputChange} // Validate on blur
                                        error={!!errors.firstName}
                                        helperText={errors.firstName && 'This field cannot be empty'}
                                    />
                                </Grid>
                                <Grid item xs={5.8} style={{marginLeft:'17px'}}>
                                    <TextField
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                        onBlur={handleInputChange} // Validate on blur
                                        error={!!errors.lastName}
                                        helperText={errors.lastName && 'This field cannot be empty'}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                        onBlur={handleInputChange} // Validate on blur
                                        error={!!errors.email}
                                        helperText={errors.email && 'This field cannot be empty'}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Contact Number"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handlePhoneInputChange}
                                        fullWidth
                                        margin="normal"
                                        onBlur={validatePhoneInputOnBlur} // Validate on blur
                                        error={!!errors.contactNumber}
                                        helperText={errors.contactNumber}
                                        inputProps={{
                                            maxLength: 14 // Limit input length to fit formatted number
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Business Legal Name"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                        onBlur={handleInputChange} // Validate on blur
                                        error={!!errors.businessName}
                                        helperText={errors.businessName && 'This field cannot be empty'}
                                    />
                                </Grid>
                                <Grid item xs={12} style={{marginTop:"15px"}}>
                                    <TextField
                                        error={!!errorMessages.SSN}
                                        label="SSN"
                                        variant="outlined"
                                        name="SSN"
                                        value={taxDetails.SSN}
                                        onChange={handleInputChangeSSN(setTaxDetails, setErrorMessages)}
                                        fullWidth
                                        required
                                    />
                                    {errorMessages.SSN && <Typography variant="caption" color="error">{errorMessages.SSN}</Typography>}
                                </Grid>
                            </Grid>
                            {/* <FormControlLabel
                                control={<Checkbox name="agreement" checked={formData.agreement} onChange={handleInputChange} />}
                                // eslint-disable-next-line react/no-unescaped-entities
                                label={<Typography variant="body2">By selecting "Get Loan Offers" you agree to our <a href="https://www.klendify.com/privacy-policy" target="_blank">Privacy Policy</a>.</Typography>}
                                className="agreement-checkbox"
                            /> */}
                            <div className="step-navigation">
                                {/* <Button variant="contained" color="secondary" onClick={handleBack} className="back-button">
                                    Back
                                </Button> */}
                                <Button variant="contained" color="primary" onClick={handleSubmit} className="loan-next-button" disabled={!isStep4Valid()}>
                                    Get Loan Offers
                                </Button>
                            </div>
                        </div>
                    )}
                    {activeStep === steps.length && (
                        <div className="completion-message">
                            {/* <div className="completion-icon">

                                <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24"><path fill="#1e2a78" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.706 18.207l-4.793-4.793 1.414-1.414 3.379 3.379 7.379-7.379 1.414 1.414-8.793 8.793z" /></svg>
                            </div> */}
                            <FinishingAnimation />
                            <Typography variant="h5" align="center" gutterBottom>
                                {message}
                            </Typography>
                            <Button variant="contained" color="primary" className="next-button" onClick={changeForm}>
                                Continue
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MultiStepForm;
