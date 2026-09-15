/**
 * A deterministic 4-question quiz: filtering the DVA-C02 bank down to topic
 * "Deployment" + theme group "services" containing both "codecommit" and "ec2"
 * (match all) isolates exactly these 4 questions, in this order. Combined with a
 * pinned RNG (see helpers/quiz.ts `pinDeterministicShuffle`), the sampled quiz
 * session always contains these questions in this order.
 *
 * The topic/theme breakdown numbers below are computed by hand from each
 * question's raw `themes` tags and the scripted correct/incorrect script, using
 * the app's own documented rule: group by tag, percent = round(correct/total*100).
 */
export const certCode = 'DVA-C02'
export const certExamName = 'AWS Certified Developer - Associate'

export const topicFilter = 'Deployment'
export const themeGroup = 'services'
export const themeValues = ['codecommit', 'ec2']

export interface ScriptedQuestion {
  id: string
  selectAnswers: string[]
  correct: boolean
  correctAnswers: string[]
  questionText: string
  optionsCount: number
  themes: Record<string, string[]>
  flaggedAfterQuiz: boolean
}

export const scriptedQuestions: ScriptedQuestion[] = [
  {
    id: '24',
    selectAnswers: ['A'],
    correct: true,
    correctAnswers: ['A'],
    questionText:
      "A company wants to deploy and maintain static websites on AWS. Each website's source code is hosted in one of several version control systems, including AWS CodeCommit, Bitbucket, and GitHub. The company wants to implement phased releases by using development, staging, user acceptance testing, and production environments in the AWS Cloud. Deployments to each environment must be started by code merges on the relevant Git branch. The company wants to use HTTPS for all data exchange. The company needs a solution that does not require servers to run continuously. Which solution will meet these requirements with the LEAST operational overhead?",
    optionsCount: 4,
    themes: {
      services: ['s3', 'ec2', 'codepipeline', 'elastic-beanstalk', 'codecommit', 'codebuild'],
      concepts: ['cicd-pipeline', 'versioning-rollback', 'serverless'],
      questionTypes: ['most-cost-effective', 'configuration', 'architecture-decision'],
    },
    flaggedAfterQuiz: true,
  },
  {
    id: '241',
    selectAnswers: ['A', 'B'],
    correct: true,
    correctAnswers: ['A', 'B'],
    questionText:
      "A company is using AWS CodePipeline to deliver one of its applications. The delivery pipeline is triggered by changes to the main branch of an AWS CodeCommit repository and uses AWS CodeBuild to implement the test and build stages of the process and AWS CodeDeploy to deploy the application. The pipeline has been operating successfully for several months and there have been no modifications. Following a recent change to the application’s source code, AWS CodeDeploy has not deployed the updated application as expected. What are the possible causes? (Choose two.)",
    optionsCount: 5,
    themes: {
      services: ['codepipeline', 'codedeploy', 'codecommit', 'ec2', 'codebuild'],
      concepts: ['cicd-pipeline'],
      questionTypes: ['how-to-deploy', 'troubleshooting', 'multi-step-scenario'],
    },
    flaggedAfterQuiz: false,
  },
  {
    id: '416',
    selectAnswers: ['A'],
    correct: false,
    correctAnswers: ['B'],
    questionText:
      'A developer has built an application running on AWS Lambda using AWS Serverless Application Model (AWS SAM). What is the correct sequence of steps to successfully deploy the application?',
    optionsCount: 4,
    themes: {
      services: ['sam', 's3', 'efs-ebs', 'codecommit', 'lambda', 'ec2'],
      concepts: ['serverless', 'iac', 'cicd-pipeline'],
      questionTypes: ['how-to-deploy', 'multi-step-scenario'],
    },
    flaggedAfterQuiz: false,
  },
  {
    id: '421',
    selectAnswers: ['A', 'B'],
    correct: false,
    correctAnswers: ['A', 'C'],
    questionText:
      'A development team wants to immediately build and deploy an application whenever there is a change to the source code. Which approaches could be used to trigger the deployment? (Choose two.)',
    optionsCount: 5,
    themes: {
      services: ['s3', 'codepipeline', 'efs-ebs', 'ec2', 'codecommit'],
      concepts: ['cicd-pipeline', 'encryption'],
      questionTypes: ['configuration', 'multi-step-scenario'],
    },
    flaggedAfterQuiz: false,
  },
]

export const expectedResult = {
  totalQuestions: 4,
  correctCount: 2,
  percent: 50,
  projectedScore: 500,
  scale: 1000,
  passed: false,
}

export interface BreakdownRow {
  label: string
  correct: number
  total: number
}

export const topicBreakdown: BreakdownRow[] = [{ label: topicFilter, correct: 2, total: 4 }]

export const themeGroupsInOrder = ['services', 'concepts', 'questionTypes']

export const themeBreakdown: Record<string, BreakdownRow[]> = {
  services: [
    { label: 's3', correct: 1, total: 3 },
    { label: 'ec2', correct: 2, total: 4 },
    { label: 'codepipeline', correct: 2, total: 3 },
    { label: 'elastic-beanstalk', correct: 1, total: 1 },
    { label: 'codecommit', correct: 2, total: 4 },
    { label: 'codebuild', correct: 2, total: 2 },
    { label: 'codedeploy', correct: 1, total: 1 },
    { label: 'sam', correct: 0, total: 1 },
    { label: 'efs-ebs', correct: 0, total: 2 },
    { label: 'lambda', correct: 0, total: 1 },
  ],
  concepts: [
    { label: 'cicd-pipeline', correct: 2, total: 4 },
    { label: 'versioning-rollback', correct: 1, total: 1 },
    { label: 'serverless', correct: 1, total: 2 },
    { label: 'iac', correct: 0, total: 1 },
    { label: 'encryption', correct: 0, total: 1 },
  ],
  questionTypes: [
    { label: 'most-cost-effective', correct: 1, total: 1 },
    { label: 'configuration', correct: 1, total: 2 },
    { label: 'architecture-decision', correct: 1, total: 1 },
    { label: 'how-to-deploy', correct: 1, total: 2 },
    { label: 'troubleshooting', correct: 1, total: 1 },
    { label: 'multi-step-scenario', correct: 1, total: 3 },
  ],
}
