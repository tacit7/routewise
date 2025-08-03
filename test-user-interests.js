// Quick test to check if UserInterests component can be imported without errors
import('./client/src/components/user-interests.tsx')
  .then(() => {
    console.log('✅ UserInterests component imported successfully');
  })
  .catch((error) => {
    console.error('❌ Error importing UserInterests component:', error);
  });