#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// Tool definitions
const listChannelsTool = {
    name: "slack_list_channels",
    description: "List public or pre-defined channels in the workspace with pagination",
    inputSchema: {
        type: "object",
        properties: {
            limit: {
                type: "number",
                description: "Maximum number of channels to return (default 100, max 200)",
                default: 100,
            },
            cursor: {
                type: "string",
                description: "Pagination cursor for next page of results",
            },
        },
    },
};
const postMessageTool = {
    name: "slack_post_message",
    description: "Post a new message to a Slack channel",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel to post to",
            },
            text: {
                type: "string",
                description: "The message text to post",
            },
        },
        required: ["channel_id", "text"],
    },
};
const replyToThreadTool = {
    name: "slack_reply_to_thread",
    description: "Reply to a specific message thread in Slack",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel containing the thread",
            },
            thread_ts: {
                type: "string",
                description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
            },
            text: {
                type: "string",
                description: "The reply text",
            },
        },
        required: ["channel_id", "thread_ts", "text"],
    },
};
const addReactionTool = {
    name: "slack_add_reaction",
    description: "Add a reaction emoji to a message",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel containing the message",
            },
            timestamp: {
                type: "string",
                description: "The timestamp of the message to react to",
            },
            reaction: {
                type: "string",
                description: "The name of the emoji reaction (without ::)",
            },
        },
        required: ["channel_id", "timestamp", "reaction"],
    },
};
const removeReactionTool = {
    name: "slack_remove_reaction",
    description: "Remove a reaction emoji from a message",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel containing the message",
            },
            timestamp: {
                type: "string",
                description: "The timestamp of the message to remove reaction from",
            },
            reaction: {
                type: "string",
                description: "The name of the emoji reaction to remove (without ::)",
            },
        },
        required: ["channel_id", "timestamp", "reaction"],
    },
};
const getChannelHistoryTool = {
    name: "slack_get_channel_history",
    description: "Get recent messages from a channel or a specific message by timestamp",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel",
            },
            limit: {
                type: "number",
                description: "Number of messages to retrieve (default 10)",
                default: 10,
            },
            latest: {
                type: "string",
                description: "End of time range of messages to include in results (timestamp)",
            },
            oldest: {
                type: "string",
                description: "Start of time range of messages to include in results (timestamp)",
            },
            inclusive: {
                type: "boolean",
                description: "Include messages with latest or oldest timestamp in results",
                default: false,
            },
        },
        required: ["channel_id"],
    },
};
const getThreadRepliesTool = {
    name: "slack_get_thread_replies",
    description: "Get all replies in a message thread",
    inputSchema: {
        type: "object",
        properties: {
            channel_id: {
                type: "string",
                description: "The ID of the channel containing the thread",
            },
            thread_ts: {
                type: "string",
                description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
            },
        },
        required: ["channel_id", "thread_ts"],
    },
};
const getUsersTool = {
    name: "slack_get_users",
    description: "Get a list of all users in the workspace with their basic profile information",
    inputSchema: {
        type: "object",
        properties: {
            cursor: {
                type: "string",
                description: "Pagination cursor for next page of results",
            },
            limit: {
                type: "number",
                description: "Maximum number of users to return (default 100, max 200)",
                default: 100,
            },
        },
    },
};
const getUserProfileTool = {
    name: "slack_get_user_profile",
    description: "Get detailed profile information for a specific user",
    inputSchema: {
        type: "object",
        properties: {
            user_id: {
                type: "string",
                description: "The ID of the user",
            },
        },
        required: ["user_id"],
    },
};
const searchMessagesTool = {
    name: "slack_search_messages",
    description: "Search for messages matching a query",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query",
            },
            count: {
                type: "number",
                description: "Number of items to return per page (default 20)",
                default: 20,
            },
            highlight: {
                type: "boolean",
                description: "Enable query highlight markers",
                default: false,
            },
            sort: {
                type: "string",
                description: "Sort matches by 'score' or 'timestamp'",
                enum: ["score", "timestamp"],
                default: "score",
            },
            sort_dir: {
                type: "string",
                description: "Sort direction",
                enum: ["asc", "desc"],
                default: "desc",
            },
        },
        required: ["query"],
    },
};
const getMessageByUrlTool = {
    name: "slack_get_message_by_url",
    description: "Get a specific message using a Slack message URL",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "The Slack message URL (e.g., https://workspace.slack.com/archives/CHANNEL_ID/pTIMESTAMP)",
            },
        },
        required: ["url"],
    },
};
class SlackClient {
    botHeaders;
    constructor(botToken) {
        this.botHeaders = {
            Authorization: `Bearer ${botToken}`,
            "Content-Type": "application/json",
        };
    }
    async getChannels(limit = 100, cursor) {
        const predefinedChannelIds = process.env.SLACK_CHANNEL_IDS;
        if (!predefinedChannelIds) {
            const params = new URLSearchParams({
                types: "public_channel",
                exclude_archived: "true",
                limit: Math.min(limit, 200).toString(),
                team_id: process.env.SLACK_TEAM_ID,
            });
            if (cursor) {
                params.append("cursor", cursor);
            }
            const response = await fetch(`https://slack.com/api/conversations.list?${params}`, { headers: this.botHeaders });
            return response.json();
        }
        const predefinedChannelIdsArray = predefinedChannelIds.split(",").map((id) => id.trim());
        const channels = [];
        for (const channelId of predefinedChannelIdsArray) {
            const params = new URLSearchParams({
                channel: channelId,
            });
            const response = await fetch(`https://slack.com/api/conversations.info?${params}`, { headers: this.botHeaders });
            const data = await response.json();
            if (data.ok && data.channel && !data.channel.is_archived) {
                channels.push(data.channel);
            }
        }
        return {
            ok: true,
            channels: channels,
            response_metadata: { next_cursor: "" },
        };
    }
    async postMessage(channel_id, text) {
        const response = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                text: text,
            }),
        });
        return response.json();
    }
    async postReply(channel_id, thread_ts, text) {
        const response = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                thread_ts: thread_ts,
                text: text,
            }),
        });
        return response.json();
    }
    async addReaction(channel_id, timestamp, reaction) {
        const response = await fetch("https://slack.com/api/reactions.add", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                timestamp: timestamp,
                name: reaction,
            }),
        });
        return response.json();
    }
    async removeReaction(channel_id, timestamp, reaction) {
        const response = await fetch("https://slack.com/api/reactions.remove", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                timestamp: timestamp,
                name: reaction,
            }),
        });
        return response.json();
    }
    async getChannelHistory(channel_id, limit = 10, latest = undefined, oldest = undefined, inclusive = false) {
        const params = new URLSearchParams({
            channel: channel_id,
            limit: limit.toString(),
            inclusive: inclusive.toString(),
        });

        if (latest) {
            params.append("latest", latest);
        }
        if (oldest) {
            params.append("oldest", oldest);
        }

        const response = await fetch(`https://slack.com/api/conversations.history?${params}`, { headers: this.botHeaders });
        return response.json();
    }
    async getThreadReplies(channel_id, thread_ts) {
        const params = new URLSearchParams({
            channel: channel_id,
            ts: thread_ts,
        });
        const response = await fetch(`https://slack.com/api/conversations.replies?${params}`, { headers: this.botHeaders });
        return response.json();
    }
    async getUsers(limit = 100, cursor) {
        const params = new URLSearchParams({
            limit: Math.min(limit, 200).toString(),
            team_id: process.env.SLACK_TEAM_ID,
        });
        if (cursor) {
            params.append("cursor", cursor);
        }
        const response = await fetch(`https://slack.com/api/users.list?${params}`, {
            headers: this.botHeaders,
        });
        return response.json();
    }
    async getUserProfile(user_id) {
        const params = new URLSearchParams({
            user: user_id,
            include_labels: "true",
        });
        const response = await fetch(`https://slack.com/api/users.profile.get?${params}`, { headers: this.botHeaders });
        return response.json();
    }
    async searchMessages(query, count = 20, highlight = false, sort = "score", sort_dir = "desc") {
        const params = new URLSearchParams({
            query,
            count: count.toString(),
            highlight: highlight.toString(),
            sort,
            sort_dir,
        });
        const response = await fetch(`https://slack.com/api/search.messages?${params}`, { headers: this.botHeaders });
        return response.json();
    }
    parseSlackUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const channelId = pathParts[pathParts.indexOf('archives') + 1];
            const timestampStr = pathParts[pathParts.indexOf('archives') + 2];

            if (!channelId || !timestampStr || !timestampStr.startsWith('p')) {
                throw new Error('Invalid Slack URL format');
            }

            // Convert timestamp from p1234567890123456 to 1234567890.123456
            const timestamp = timestampStr.slice(1);
            const formattedTimestamp = `${timestamp.slice(0, -6)}.${timestamp.slice(-6)}`;

            return {
                channelId,
                timestamp: formattedTimestamp
            };
        } catch (error) {
            throw new Error(`Failed to parse Slack URL: ${error.message}`);
        }
    }
    async getMessageByUrl(url) {
        const { channelId, timestamp } = this.parseSlackUrl(url);
        return this.getChannelHistory(channelId, 1, timestamp, timestamp, true);
    }
}
async function main() {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const teamId = process.env.SLACK_TEAM_ID;
    if (!botToken || !teamId) {
        console.error("Please set SLACK_BOT_TOKEN and SLACK_TEAM_ID environment variables");
        process.exit(1);
    }
    console.error("Starting Slack MCP Server...");
    const server = new Server({
        name: "Slack MCP Server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    const slackClient = new SlackClient(botToken);
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        console.error("Received CallToolRequest:", request);
        try {
            if (!request.params.arguments) {
                throw new Error("No arguments provided");
            }
            switch (request.params.name) {
                case "slack_list_channels": {
                    const args = request.params
                        .arguments;
                    const response = await slackClient.getChannels(args.limit, args.cursor);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_post_message": {
                    const args = request.params.arguments;
                    if (!args.channel_id || !args.text) {
                        throw new Error("Missing required arguments: channel_id and text");
                    }
                    const response = await slackClient.postMessage(args.channel_id, args.text);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_reply_to_thread": {
                    const args = request.params
                        .arguments;
                    if (!args.channel_id || !args.thread_ts || !args.text) {
                        throw new Error("Missing required arguments: channel_id, thread_ts, and text");
                    }
                    const response = await slackClient.postReply(args.channel_id, args.thread_ts, args.text);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_add_reaction": {
                    const args = request.params.arguments;
                    if (!args.channel_id || !args.timestamp || !args.reaction) {
                        throw new Error("Missing required arguments: channel_id, timestamp, and reaction");
                    }
                    const response = await slackClient.addReaction(args.channel_id, args.timestamp, args.reaction);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_remove_reaction": {
                    const args = request.params.arguments;
                    if (!args.channel_id || !args.timestamp || !args.reaction) {
                        throw new Error("Missing required arguments: channel_id, timestamp, and reaction");
                    }
                    const response = await slackClient.removeReaction(args.channel_id, args.timestamp, args.reaction);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_get_channel_history": {
                    const args = request.params
                        .arguments;
                    if (!args.channel_id) {
                        throw new Error("Missing required argument: channel_id");
                    }
                    const response = await slackClient.getChannelHistory(
                        args.channel_id,
                        args.limit,
                        args.latest,
                        args.oldest,
                        args.inclusive
                    );
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_get_thread_replies": {
                    const args = request.params
                        .arguments;
                    if (!args.channel_id || !args.thread_ts) {
                        throw new Error("Missing required arguments: channel_id and thread_ts");
                    }
                    const response = await slackClient.getThreadReplies(args.channel_id, args.thread_ts);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_get_users": {
                    const args = request.params.arguments;
                    const response = await slackClient.getUsers(args.limit, args.cursor);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_get_user_profile": {
                    const args = request.params
                        .arguments;
                    if (!args.user_id) {
                        throw new Error("Missing required argument: user_id");
                    }
                    const response = await slackClient.getUserProfile(args.user_id);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_search_messages": {
                    const args = request.params.arguments;
                    if (!args.query) {
                        throw new Error("Missing required argument: query");
                    }
                    const response = await slackClient.searchMessages(
                        args.query,
                        args.count,
                        args.highlight,
                        args.sort,
                        args.sort_dir
                    );
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                case "slack_get_message_by_url": {
                    const args = request.params.arguments;
                    if (!args.url) {
                        throw new Error("Missing required argument: url");
                    }
                    const response = await slackClient.getMessageByUrl(args.url);
                    return {
                        content: [{ type: "text", text: JSON.stringify(response) }],
                    };
                }
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        }
        catch (error) {
            console.error("Error executing tool:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                        }),
                    },
                ],
            };
        }
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.error("Received ListToolsRequest");
        return {
            tools: [
                listChannelsTool,
                postMessageTool,
                replyToThreadTool,
                addReactionTool,
                removeReactionTool,
                getChannelHistoryTool,
                getThreadRepliesTool,
                getUsersTool,
                getUserProfileTool,
                searchMessagesTool,
                getMessageByUrlTool,
            ],
        };
    });
    const transport = new StdioServerTransport();
    console.error("Connecting server to transport...");
    await server.connect(transport);
    console.error("Slack MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
