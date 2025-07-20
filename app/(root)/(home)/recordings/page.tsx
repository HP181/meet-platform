import CallList from '@/components/CallList';
import RecordingsPage from '@/components/RecordingsList';
import RecordingsList from '@/components/RecordingsList';

const PreviousPage = () => {
  return (
    <section className="flex size-full flex-col gap-10 text-white">
      {/* <h1 className="text-3xl font-bold">Recordings</h1> */}

      {/* <CallList type="recordings" /> */}

       {/* <RecordingsList /> */}
       <RecordingsPage />
    </section>
  );
};

export default PreviousPage;
