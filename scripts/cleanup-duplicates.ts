import { findAndDeleteDuplicateExpenses } from '../src/lib/db';
import { auth } from '../src/lib/firebase';

async function cleanup() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const recurringId = 'e65DMu8LtC4q0g9sX7vL';
    console.log('Starting cleanup for recurring expense:', recurringId);
    
    const result = await findAndDeleteDuplicateExpenses(user.uid, recurringId);
    console.log('Cleanup result:', result);
    
    if (result.success) {
      console.log(`Successfully deleted ${result.deletedCount} duplicate expenses`);
    } else {
      console.error('Cleanup failed:', result.error);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanup(); 