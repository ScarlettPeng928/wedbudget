import { cities } from '../../data/cities';
import OptionSelect from './OptionSelect';

// Pick one city from the list (no typing: it must be a city we have vendors for).
// `extraOption` adds a first choice that isn't a city, like All Taiwan on the
// vendors pages.
export default function CitySelect({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  extraOption,
}: {
  id: string;
  value: string; // city slug, '' when none
  onChange: (slug: string) => void;
  invalid?: boolean;
  describedBy?: string;
  extraOption?: { value: string; label: string };
}) {
  const options = [...(extraOption ? [extraOption] : []), ...cities.map((c) => ({ value: c.slug, label: c.name }))];
  return (
    <OptionSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select a city"
      invalid={invalid}
      describedBy={describedBy}
    />
  );
}
