import type { Meta, StoryObj } from '@storybook/react-vite';

type ButtonProps = {
  label: string;
  primary?: boolean;
};

function Button({ label, primary = false }: ButtonProps) {
  return (
    <button
      type="button"
      style={{
        border: 0,
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 16px',
        background: primary ? '#1f6feb' : '#f0f3f6',
        color: primary ? '#fff' : '#24292f',
      }}
    >
      {label}
    </button>
  );
}

const meta = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    label: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Primary button',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary button',
  },
};
