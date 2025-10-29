import { StyleSheet } from 'react-native';
export const globalStyles = StyleSheet.create(
{

    display: {
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingTop: 64,
    },

    container: {
        paddingHorizontal: 12,
        marginVertical: 12,
        borderRadius: 8,
    },

    card: {
      borderRadius: 8,
      padding: 8,
      marginVertical: 6,
      marginHorizontal: 4
    },

    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },

    empty: {
      textAlign: 'center',
      color: '#999',
      marginTop: 20,
    },

    habitText: {
        fontSize: 16,
    },

    listItem: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        margin: 2,
        marginBottom: 10,
    },
    
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#ddd',
    },

    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },

    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },

    inputCard: {
      marginBottom: 16,
    },

    input: {
      marginBottom: 10,
    },

    button: {
      alignSelf: 'flex-end',
    },
    
    row: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
        
    text: { 
        fontSize: 16 
    },

    header: {
        marginHorizontal: 16,
        marginBottom: 12,
    },

    sectionTitle: {
        marginBottom: 8,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    inRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    modal: {
      margin: 20,
      padding: 20,
    },

    yellow: {
      color: '#e6bb02'
    }, 

    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    
    modalContent: {
      width: '90%',
      padding: 20,
      borderRadius: 10,
      backgroundColor: 'white',
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },

    closeButton: {
      marginTop: 50,
    }, 

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adjust based on your theme
    },

    successMessageContainer: {
      position: 'absolute',
      top: 0, // Center vertically
      left: '50%', // Center horizontally
      transform: [{ translateX: -50 }, { translateY: -50 }], // Adjust for centering
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000, // Ensure it appears above all other elements
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional: Add a semi-transparent background
      width: 120, // Set width to make it square
      height: 120, // Set height to match width
      borderRadius: 10, // Slightly rounded corners
    },

});