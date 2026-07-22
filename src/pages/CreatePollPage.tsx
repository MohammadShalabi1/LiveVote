import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePoll } from "../hooks/useCreatePoll";
import { useCreatorToken } from "../hooks/useCreatorToken";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Option is required"),
      })
    )
    .min(2, "At least 2 options are required"),
});

type FormData = z.infer<typeof schema>;

export default function CreatePollPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: "",
      options: [{ text: "" }, { text: "" }],
    },
  });

  const navigate = useNavigate();
  const creatorToken = useCreatorToken();
  const createPollMutation = useCreatePoll();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  function onSubmit(data: FormData) {
    createPollMutation.mutate({
        data,creatorToken
    },{
        onSuccess:(poll)=>{
            navigate(`/poll/${poll.id}`)
        }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Question</label>
      <br />
      <input
        type="text"
        placeholder="Enter your question"
        {...register("question")}
      />
      <p>{errors.question?.message}</p>

      <br />

      {fields.map((field, index) => (
        <div key={field.id}>
          <label>Option {index + 1}</label>
          <br />

          <input
            type="text"
            placeholder={`Option ${index + 1}`}
            {...register(`options.${index}.text`)}
          />

          <p>{errors.options?.[index]?.text?.message}</p>

          <button
            type="button"
            disabled={fields.length <= 2}
            onClick={() => remove(index)}
          >
            Remove
          </button>

          <br />
          <br />
        </div>
      ))}

      <p>{errors.options?.message}</p>

      <button
        type="button"
        onClick={() => append({ text: "" })}
      >
        Add Option
      </button>

      <br />
      <br />

      <button type="submit">Create Poll</button>
    </form>
  );
}