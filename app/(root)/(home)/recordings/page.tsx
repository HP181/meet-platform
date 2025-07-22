import CallList from "@/components/CallList";


const PreviousPage = () => {
  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <CallList type="recordings" />
    </section>
  );
};

export default PreviousPage;
