/* eslint-disable react/prop-types */
import { CONTENT_BLOCK_TYPE } from '../../constants/contentBlockTypes';
import TopicBlock from './TopicBlock';

const SECTION_DEFINITIONS = [
  {
    title: 'Explanation',
    types: [
      CONTENT_BLOCK_TYPE.HEADING,
      CONTENT_BLOCK_TYPE.PARAGRAPH,
      CONTENT_BLOCK_TYPE.TIP,
      CONTENT_BLOCK_TYPE.WARNING,
    ],
  },
  {
    title: 'Real-world examples',
    types: [CONTENT_BLOCK_TYPE.REAL_WORLD_EXAMPLE],
  },
  {
    title: 'Common mistakes',
    types: [CONTENT_BLOCK_TYPE.COMMON_MISTAKE],
  },
  {
    title: 'Practice',
    types: [
      CONTENT_BLOCK_TYPE.EXAMPLE,
      CONTENT_BLOCK_TYPE.CODE,
      CONTENT_BLOCK_TYPE.VIDEO_REFERENCE,
    ],
  },
  {
    title: 'Mini quiz',
    types: [CONTENT_BLOCK_TYPE.QUIZ_REFERENCE],
  },
];

function getBlocksForSection(blocks, types) {
  return blocks.filter((block) => types.includes(block.type));
}

function TopicRenderer({ topic }) {
  return (
    <div className="space-y-8">
      {SECTION_DEFINITIONS.map((section) => {
        const sectionBlocks = getBlocksForSection(topic.blocks, section.types);

        return (
          <section
            key={section.title}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              {section.title}
            </h2>
            {sectionBlocks.length ? (
              <div className="mt-5 space-y-5">
                {sectionBlocks.map((block) => (
                  <TopicBlock key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This section will be expanded soon.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default TopicRenderer;
