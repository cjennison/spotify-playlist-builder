"use client";

import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconBrandSpotify,
  IconCheck,
  IconExternalLink,
  IconMusic,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import type { Identity, ResolvedTrack } from "@/types";

interface GenerateResponse {
  name: string;
  description: string;
  tracks: ResolvedTrack[];
}

const emptyIdentity = (): Identity => ({ name: "", artists: [""] });

export default function Builder({ spotifyLinked }: { spotifyLinked: boolean }) {
  const [identities, setIdentities] = useState<Identity[]>([
    { name: "", artists: [""] },
    { name: "", artists: [""] },
  ]);
  const [size, setSize] = useState(20);
  const [knownRatio, setKnownRatio] = useState(0.6);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  function updateIdentity(idx: number, patch: Partial<Identity>) {
    setIdentities((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function updateArtist(idIdx: number, artIdx: number, value: string) {
    setIdentities((prev) =>
      prev.map((it, i) => {
        if (i !== idIdx) return it;
        const artists = [...it.artists];
        artists[artIdx] = value;
        return { ...it, artists };
      })
    );
  }

  function addArtist(idIdx: number) {
    setIdentities((prev) =>
      prev.map((it, i) =>
        i === idIdx ? { ...it, artists: [...it.artists, ""] } : it
      )
    );
  }

  function removeArtist(idIdx: number, artIdx: number) {
    setIdentities((prev) =>
      prev.map((it, i) =>
        i === idIdx
          ? { ...it, artists: it.artists.filter((_, a) => a !== artIdx) }
          : it
      )
    );
  }

  function addIdentity() {
    setIdentities((prev) => [...prev, emptyIdentity()]);
  }

  function removeIdentity(idx: number) {
    setIdentities((prev) => prev.filter((_, i) => i !== idx));
  }

  function cleanedIdentities(): Identity[] {
    return identities
      .map((i) => ({
        name: i.name.trim(),
        artists: i.artists.map((a) => a.trim()).filter(Boolean),
      }))
      .filter((i) => i.name && i.artists.length > 0);
  }

  async function generate() {
    setError(null);
    setResult(null);
    setPlaylistUrl(null);

    const cleaned = cleanedIdentities();
    if (cleaned.length < 2) {
      setError("Add at least two identities, each with a name and one artist.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identities: cleaned, size, knownRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate.");
      setResult(data as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist() {
    if (!result) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          description: result.description,
          uris: result.tracks.map((t) => t.uri),
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist.");
      setPlaylistUrl(data.url);
      notifications.show({
        color: "brand",
        icon: <IconCheck size={16} />,
        title: "Playlist created",
        message: "Your blended playlist is now in Spotify.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create playlist.";
      setError(msg);
      notifications.show({ color: "red", title: "Couldn't save", message: msg });
    } finally {
      setCreating(false);
    }
  }

  const knownPct = Math.round(knownRatio * 100);

  return (
    <Container size={960} py={40}>
      <Stack gap={36}>
        {!spotifyLinked && (
          <Alert
            variant="light"
            color="yellow"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            title="Connect Spotify to continue"
          >
            Link your Spotify account using the button in the top-right to
            generate and save playlists.
          </Alert>
        )}

        {/* Identities */}
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Stack gap={2}>
              <Title order={2} style={{ letterSpacing: "-0.02em" }}>
                Identities
              </Title>
              <Text c="dimmed" fz="sm">
                Add each person and a few artists they love.
              </Text>
            </Stack>
            <Button
              variant="default"
              radius="md"
              leftSection={<IconUserPlus size={16} />}
              onClick={addIdentity}
            >
              Add identity
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {identities.map((identity, idIdx) => (
              <Card
                key={idIdx}
                withBorder
                radius="md"
                padding="lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Stack gap="sm">
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      flex={1}
                      size="md"
                      placeholder={`Person ${idIdx + 1}`}
                      value={identity.name}
                      onChange={(e) =>
                        updateIdentity(idIdx, { name: e.currentTarget.value })
                      }
                    />
                    {identities.length > 2 && (
                      <Tooltip label="Remove person" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="lg"
                          aria-label="Remove identity"
                          onClick={() => removeIdentity(idIdx)}
                        >
                          <IconX size={18} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>

                  <Text
                    fz="xs"
                    fw={600}
                    c="dimmed"
                    tt="uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Liked artists
                  </Text>

                  <Stack gap="xs">
                    {identity.artists.map((artist, artIdx) => (
                      <TextInput
                        key={artIdx}
                        placeholder="e.g. Cake"
                        value={artist}
                        onChange={(e) =>
                          updateArtist(idIdx, artIdx, e.currentTarget.value)
                        }
                        rightSection={
                          identity.artists.length > 1 ? (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              aria-label="Remove artist"
                              onClick={() => removeArtist(idIdx, artIdx)}
                            >
                              <IconTrash size={15} />
                            </ActionIcon>
                          ) : null
                        }
                      />
                    ))}
                  </Stack>

                  <Button
                    variant="subtle"
                    color="brand"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => addArtist(idIdx)}
                    style={{ alignSelf: "flex-start" }}
                  >
                    Add artist
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>

        {/* Controls */}
        <Card
          withBorder
          radius="md"
          padding="xl"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <Stack gap="xl">
            <Box>
              <Group justify="space-between" mb="xs">
                <Text fw={600} fz="sm">
                  Playlist size
                </Text>
                <Badge variant="light" color="gray" radius="sm">
                  {size} tracks
                </Badge>
              </Group>
              <Slider
                color="brand"
                min={4}
                max={50}
                value={size}
                onChange={setSize}
                marks={[
                  { value: 4, label: "4" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                ]}
              />
            </Box>

            <Box>
              <Group justify="space-between" mb="xs">
                <Text fw={600} fz="sm">
                  Known vs. discovery
                </Text>
                <Badge variant="light" color="brand" radius="sm">
                  {knownPct}% known · {100 - knownPct}% discovery
                </Badge>
              </Group>
              <Slider
                color="brand"
                min={0}
                max={100}
                value={knownPct}
                onChange={(v) => setKnownRatio(v / 100)}
                marks={[
                  { value: 0, label: "Discover" },
                  { value: 100, label: "Familiar" },
                ]}
              />
              <Text c="dimmed" fz="xs" mt="lg">
                Higher keeps more songs by artists they already love. Lower leans
                into music-theory-based discoveries.
              </Text>
            </Box>

            <Button
              size="md"
              radius="md"
              color="brand"
              fullWidth
              loading={loading}
              disabled={!spotifyLinked}
              leftSection={<IconSparkles size={18} />}
              onClick={generate}
            >
              {loading ? "Blending tastes…" : "Generate playlist"}
            </Button>
          </Stack>
        </Card>

        {error && (
          <Alert
            variant="light"
            color="red"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
              <Stack gap={2}>
                <Title order={2} style={{ letterSpacing: "-0.02em" }}>
                  {result.name}
                </Title>
                <Text c="dimmed" fz="sm">
                  {result.description}
                </Text>
                <Text c="dimmed" fz="xs" mt={2}>
                  {result.tracks.length} tracks matched on Spotify
                </Text>
              </Stack>
              <Group gap="md">
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.currentTarget.checked)}
                  label="Public"
                  color="brand"
                />
                <Button
                  radius="md"
                  color="brand"
                  loading={creating}
                  leftSection={<IconBrandSpotify size={18} />}
                  onClick={createPlaylist}
                >
                  Save to Spotify
                </Button>
              </Group>
            </Group>

            {playlistUrl && (
              <Alert
                variant="light"
                color="brand"
                radius="md"
                icon={<IconCheck size={18} />}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text fz="sm">Playlist created in your Spotify library.</Text>
                  <Anchor
                    href={playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fz="sm"
                    fw={600}
                  >
                    <Group gap={4} wrap="nowrap">
                      Open <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                </Group>
              </Alert>
            )}

            <Paper
              withBorder
              radius="md"
              style={{ overflow: "hidden", backgroundColor: "var(--surface)" }}
            >
              {result.tracks.map((t, i) => (
                <Box key={t.uri + i}>
                  {i > 0 && <Divider />}
                  <Group gap="md" wrap="nowrap" p="sm">
                    <Avatar src={t.albumImage} radius="sm" size={44}>
                      <IconMusic size={20} />
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz="sm" fw={500} truncate>
                        {t.spotifyTitle}
                      </Text>
                      <Text fz="xs" c="dimmed" truncate>
                        {t.spotifyArtist}
                      </Text>
                    </Box>
                    <Stack gap={2} align="flex-end">
                      <Badge
                        size="sm"
                        radius="sm"
                        variant="light"
                        color={t.source === "known" ? "blue" : "grape"}
                      >
                        {t.source}
                      </Badge>
                      <Text fz={10} c="dimmed">
                        {t.identity}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
              ))}
            </Paper>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
