import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import TopicBlock from '../components/topics/TopicBlock';
import { CONTENT_BLOCK_TYPE } from '../constants/contentBlockTypes';
import { useAuth } from '../features/auth/AuthContext';
import { createCreatorTopic } from '../features/creatorStudio/creatorStudioApi';

const contentBlockOptions = Object.values(CONTENT_BLOCK_TYPE);

const defaultTopicForm = {
  title: '',
  summary: '',
  roadmapNodeId: '',
  status: 'DRAFT',
};

const defaultBlockForm = {
  type: CONTENT_BLOCK_TYPE.PARAGRAPH,
  title: '',
  content: '',
  language: '',
};

function formatBlockType(type) {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function TopicBlockEditor() {
  const { tokens } = useAuth();
  const [topicForm, setTopicForm] = useState(defaultTopicForm);
  const [blockForm, setBlockForm] = useState(defaultBlockForm);
  const [blocks, setBlocks] = useState([]);
  const [createdTopic, setCreatedTopic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function updateTopicForm(event) {
    const { name, value } = event.target;
    setTopicForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateBlockForm(event) {
    const { name, value } = event.target;
    setBlockForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function addBlock(event) {
    event.preventDefault();
    setBlocks((currentBlocks) => [
      ...currentBlocks,
      {
        ...blockForm,
        id: `draft_${currentBlocks.length}`,
        title: blockForm.title || undefined,
        language: blockForm.language || undefined,
        order: currentBlocks.length,
      },
    ]);
    setBlockForm(defaultBlockForm);
  }

  async function handleCreateTopic(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    setCreatedTopic(null);

    try {
      const data = await createCreatorTopic(tokens.accessToken, {
        topic: {
          title: topicForm.title,
          summary: topicForm.summary,
          roadmapNodeId: topicForm.roadmapNodeId || undefined,
          status: topicForm.status,
        },
        blocks: blocks.map((block) => ({
          type: block.type,
          title: block.title,
          content: block.content,
          language: block.language,
          order: block.order,
        })),
      });
      setCreatedTopic(data.topic);
      setSuccess('Topic page created.');
      setTopicForm(defaultTopicForm);
      setBlocks([]);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to create topic page'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CreatorStudioLayout title="Topic block editor">
      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}{' '}
          {createdTopic ? (
            <Link
              to={`/topics/${createdTopic.id}`}
              className="font-semibold underline"
            >
              Open topic
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Topic page
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Create W3Schools-style content
          </h2>

          <form onSubmit={handleCreateTopic} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Topic title
              <input
                name="title"
                value={topicForm.title}
                onChange={updateTopicForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="CSS Flexbox"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Summary
              <textarea
                name="summary"
                value={topicForm.summary}
                onChange={updateTopicForm}
                className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="A concise learner-facing summary."
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Roadmap node ID
              <input
                name="roadmapNodeId"
                value={topicForm.roadmapNodeId}
                onChange={updateTopicForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Optional"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Status
              <select
                name="status"
                value={topicForm.status}
                onChange={updateTopicForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={isSaving || !blocks.length}
              className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? 'Creating...' : 'Create topic page'}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Content blocks
          </h2>
          <form onSubmit={addBlock} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Block type
              <select
                name="type"
                value={blockForm.type}
                onChange={updateBlockForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {contentBlockOptions.map((type) => (
                  <option key={type} value={type}>
                    {formatBlockType(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Block title
              <input
                name="title"
                value={blockForm.title}
                onChange={updateBlockForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Real-world example"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Language
              <input
                name="language"
                value={blockForm.language}
                onChange={updateBlockForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="css"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Content
              <textarea
                name="content"
                value={blockForm.content}
                onChange={updateBlockForm}
                className="min-h-36 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Write the explanation, example, warning, or code."
                required
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Add block
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {blocks.length ? (
              blocks.map((block) => <TopicBlock key={block.id} block={block} />)
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                Add at least one block before creating the topic.
              </p>
            )}
          </div>
        </section>
      </div>
    </CreatorStudioLayout>
  );
}

export default TopicBlockEditor;
