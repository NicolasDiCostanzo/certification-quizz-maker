import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReviewBreakdown from './ReviewBreakdown.vue'

const topicBreakdown = [{ label: 'Security', correct: 3, total: 4, percent: 75 }]
const themeBreakdown = [{ group: 'services', value: 'lambda', correct: 2, total: 2, percent: 100 }]

describe('ReviewBreakdown', () => {
  it('emits reviewTopic with the topic label instead of navigating itself', async () => {
    const wrapper = mount(ReviewBreakdown, {
      props: { topicBreakdown, themeBreakdown: [], themeGroups: [], passingPercent: 70, showReviewButton: true },
    })

    await wrapper.find('.breakdown__row .btn--primary').trigger('click')

    expect(wrapper.emitted('reviewTopic')).toEqual([['Security']])
  })

  it('emits reviewTheme with the group and value instead of navigating itself', async () => {
    const wrapper = mount(ReviewBreakdown, {
      props: { topicBreakdown: [], themeBreakdown, themeGroups: ['services'], passingPercent: 70, showReviewButton: true },
    })

    await wrapper.find('.breakdown__group-toggle').trigger('click')
    await wrapper.find('.breakdown__group-content .btn--primary').trigger('click')

    expect(wrapper.emitted('reviewTheme')).toEqual([['services', 'lambda']])
  })

  it('emits reviewFlagged instead of navigating itself', async () => {
    const wrapper = mount(ReviewBreakdown, {
      props: {
        topicBreakdown: [],
        themeBreakdown: [],
        themeGroups: [],
        passingPercent: 70,
        showReviewButton: true,
        hasFlaggedQuestions: true,
      },
    })

    await wrapper.find('.flagged-review-btn').trigger('click')

    expect(wrapper.emitted('reviewFlagged')).toHaveLength(1)
  })
})
