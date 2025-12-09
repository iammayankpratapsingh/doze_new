import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width } = Dimensions.get('window');

type CustomInputProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

type FormErrors = {
  email?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  password?: string;
  confirmPassword?: string;
};


// Custom Input Component for consistent styling
const CustomInput = ({ icon, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }: CustomInputProps) => (
  <BlurView intensity={30} tint="dark" style={styles.inputContainer}>
    <Ionicons name={icon} size={22} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.5)"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </BlurView>
);

export default function SignUpDetailsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [dob, setDob] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 7)));
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [receiveNews, setReceiveNews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors:FormErrors = {};
    if (!email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid.';
    if (!firstName) newErrors.firstName = 'First name is required.';
    if (!lastName) newErrors.lastName = 'Last name is required.';
    if (!contactNumber) newErrors.contactNumber = 'Contact number is required.';
    if (!password) newErrors.password = 'Password is required.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const userData = {
      email: email,
      Password: password,
      firstName: firstName,
      lastName: lastName,
      mobileNo: contactNumber,
      newsAndOffers: receiveNews ? '1' : '0',
      dateOfBirth: dob.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      zipCode: '', // Zip code is not in the UI as per the XML
    };

    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://byosense.com/hexaskin_db/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        Alert.alert('Success', 'Registration successful! A verification mail has been sent.', [
          { text: 'OK', onPress: () => router.replace('/(authentication)/signin') },
        ]);
      } else if (result.message === 'The email address is already in use.') {
        Alert.alert('Registration Failed', 'This email is already in use. Please sign in.', [
          { text: 'OK', onPress: () => router.replace('/(authentication)/signin') },
        ]);
      } else {
        Alert.alert('Registration Failed', result.message || 'An unexpected error occurred.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date:Date) => {
    setDob(date);
    hideDatePicker();
  };

  const showNewsInfo = () => {
    Alert.alert(
      "News and Special Offers (Optional)",
      "We'll send you news, special offers, and other information about SLIMiot and its partners' products and services through email and notifications. You can unsubscribe at any time in your SLIMiot account settings."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#1D244D', '#02041A', '#1A1D3E']} style={styles.gradientBackground} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Enter your details to register</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        scrollEnabled={true}
      >
        <CustomInput icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <CustomInput icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <CustomInput icon="lock-closed-outline" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        <CustomInput icon="person-outline" placeholder="First Name" value={firstName} onChangeText={setFirstName} />
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

        <CustomInput icon="person-outline" placeholder="Last Name" value={lastName} onChangeText={setLastName} />
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

        <CustomInput icon="call-outline" placeholder="Contact Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
        {errors.contactNumber && <Text style={styles.errorText}>{errors.contactNumber}</Text>}

        <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
          <Ionicons name="calendar-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
          <Text style={styles.datePickerText}>{dob.toDateString()}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 7))}
        />

        <View style={styles.checkboxContainer}>
          <Checkbox style={styles.checkbox} value={receiveNews} onValueChange={setReceiveNews} color={receiveNews ? '#4A90E2' : undefined} />
          <Text style={styles.checkboxLabel}>Get news and special offers</Text>
          <TouchableOpacity onPress={showNewsInfo}>
            <Ionicons name="information-circle-outline" size={22} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#1D244D" /> : <Text style={styles.registerButtonText}>Register</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(authentication)/signin')}>
            <Text style={[styles.footerText, styles.footerLink]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20,  marginTop: Platform.OS === 'ios' ? 10 : 15, zIndex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' },
  scrollView: {
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 120,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', color: '#FFFFFF', fontSize: 16 },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 5 },
  checkbox: { margin: 8 },
  checkboxLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, flex: 1 },
  registerButton: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  registerButtonText: { color: '#1D244D', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#FF5A5F', fontSize: 12, paddingLeft: 15, paddingTop: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 12,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  footerLink: {
    fontWeight: 'bold',
    color: '#7EA6FF',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
});