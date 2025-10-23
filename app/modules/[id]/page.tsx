export default function ModulePage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-semcmeBlue mb-4">
        Module: {id.replace("-", " ")}
      </h1>
      <p className="text-gray-600">This is where the module content will go.</p>
    </div>
  );
}
