import { AmplifyProjectInfo, AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyRootStackTemplate, amplifyProjectInfo: AmplifyProjectInfo) {

  const authRole = resources.authRole;

  const baseManagedPolicy = Array.isArray(authRole.managedPolicyArns)
    ? authRole.managedPolicyArns
    : [authRole.managedPolicyArns];

  authRole.managedPolicyArns = [
    ...baseManagedPolicy,
    "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
  ]

}
