// How the site works, in two rows: photo on one side, a short explanation on the
// other, swapping sides on the second row. Each photo stops one gutter short of the
// screen edge, in line with the header and the rest of the page.
// To add a photo: put the file in src/assets/home/, import it here, and set `image`.
const steps: { title: string; body: string; image?: string }[] = [
  {
    title: "Start with one number.",
    body: "Enter your budget, city and guest count. We split it six ways; you fine-tune.",
  },
  {
    title: "See who fits.",
    body: "Vendors whose prices fit each part of your budget.",
  },
];

export default function HowItWorks() {
  return (
    // Same oat as the category cards above, so the two read as one sheet.
    <section aria-label="How it works" className="bg-oat">
      <div className="flex flex-col gap-[clamp(56px,10vh,120px)] py-[clamp(80px,12vh,140px)]">
        {steps.map((step, i) => {
          const imageRight = i % 2 === 1;
          return (
            <div
              key={step.title}
              className="grid items-center gap-[clamp(32px,5vw,64px)] px-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))] md:grid-cols-2 md:gap-0"
            >
              {/* Side padding on the row: the gutter, or the 1440px content edge on wide screens. */}
              <div
                className={`aspect-square bg-rosewood md:aspect-[5/4] ${imageRight ? "md:order-2" : ""}`}
              >
                {step.image && (
                  <img
                    src={step.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="px-[clamp(16px,3vw,48px)] text-center">
                <div className="mx-auto max-w-[30ch]">
                  <h2 className="m-0 font-serif text-title font-light italic">
                    {step.title}
                  </h2>
                  <p className="mt-[clamp(14px,1.6vw,20px)] mb-0 font-sans text-lead text-cocoa text-pretty">
                    {step.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
