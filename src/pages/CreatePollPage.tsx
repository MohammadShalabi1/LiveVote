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
            navigate(`/poll-created/${poll.id}`)
        }
    })
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-indigo-600/80">Create a new poll</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Build your voting poll</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Add a question, define options, and share your poll instantly with your audience.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Question</label>
            <input
              type="text"
              placeholder="Enter your question"
              {...register("question")}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            {errors.question?.message && (
              <p className="text-sm text-rose-600">{errors.question.message}</p>
            )}
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-slate-700">Option {index + 1}</label>
                  <button
                    type="button"
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  {...register(`options.${index}.text`)}
                  className="mt-4 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                {errors.options?.[index]?.text?.message && (
                  <p className="mt-2 text-sm text-rose-600">{errors.options[index]?.text?.message}</p>
                )}
              </div>
            ))}
          </div>

          {errors.options?.message && (
            <p className="text-sm text-rose-600">{errors.options.message}</p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => append({ text: "" })}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200"
            >
              Add Option
            </button>

            <button
              type="submit"
              disabled={createPollMutation.isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {createPollMutation.isPending ? "Creating..." : "Create Poll"}
            </button>
          </div>

          {createPollMutation.isError && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              We could not create that poll. Please check your Supabase setup and try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
